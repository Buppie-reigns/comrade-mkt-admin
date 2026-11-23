// COMRADE MKT CEO portal. Access is checked against public.admin_users using Supabase RLS.
const SUPABASE_URL = 'https://kmkfexumqgutclcsqlja.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_9-v-BWV98TFsUxXT7zSVPg_NoxTGTjL';
const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const loginPanel = document.getElementById('loginPanel');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const logoutButton = document.getElementById('logoutButton');
const listingMessage = document.getElementById('listingMessage');
const listingRows = document.getElementById('listingRows');
const money = value => 'KES ' + Number(value || 0).toLocaleString('en-KE');

function showLogin(message = '', isError = false) {
  dashboard.classList.add('hidden');
  loginPanel.classList.remove('hidden');
  logoutButton.classList.add('hidden');
  loginMessage.textContent = message;
  loginMessage.className = 'message' + (message ? (isError ? ' error' : ' success') : '');
}
function showDashboard(user) {
  loginPanel.classList.add('hidden');
  dashboard.classList.remove('hidden');
  logoutButton.classList.remove('hidden');
  document.getElementById('welcomeText').textContent = 'Signed in as ' + (user.email || 'CEO administrator') + '.';
}
async function verifyAdmin(user) {
  const { data, error } = await db.from('admin_users').select('id').eq('id', user.id).maybeSingle();
  if (error) throw new Error('Could not verify administrator access: ' + error.message);
  if (!data) throw new Error('This account is not registered as a COMRADE MKT administrator.');
}
async function loadDashboardData() {
  listingMessage.textContent = 'Loading active marketplace listings…';
  listingMessage.className = 'message';
  const { data, error, count } = await db.from('products')
    .select('id,title,price,category,seller_id', { count: 'exact' })
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    listingMessage.textContent = 'Could not load listings: ' + error.message;
    listingMessage.className = 'message error';
    return;
  }
  document.getElementById('activeCount').textContent = String(count ?? data.length);
  listingRows.innerHTML = (data || []).map(item =>
    '<tr><td>' + escapeHtml(item.title) + '</td><td>' + money(item.price) + '</td><td>' + escapeHtml(item.category || 'Other') + '</td><td>' + escapeHtml(String(item.seller_id).slice(0, 8)) + '…</td></tr>'
  ).join('');
  listingMessage.textContent = data.length ? 'Showing the latest ' + data.length + ' active listings.' : 'There are no active listings yet.';
  if (!data.length) listingRows.innerHTML = '<tr><td colspan="4">No active listings found.</td></tr>';
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
async function handleSession(session) {
  if (!session?.user) { showLogin(); return; }
  try {
    await verifyAdmin(session.user);
    showDashboard(session.user);
    await loadDashboardData();
  } catch (error) {
    await db.auth.signOut();
    showLogin(error.message, true);
  }
}
loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const button = document.getElementById('loginSubmit');
  const form = new FormData(loginForm);
  button.disabled = true;
  button.textContent = 'Verifying…';
  loginMessage.textContent = '';
  const { data, error } = await db.auth.signInWithPassword({
    email: String(form.get('email')).trim(),
    password: String(form.get('password'))
  });
  button.disabled = false;
  button.textContent = 'Sign in securely';
  if (error) { showLogin(error.message, true); return; }
  await handleSession(data.session);
});
logoutButton.addEventListener('click', async () => {
  await db.auth.signOut();
  showLogin('You have signed out.');
});
document.getElementById('refreshButton').addEventListener('click', loadDashboardData);
db.auth.onAuthStateChange((_event, session) => {
  if (!session) showLogin();
});
(async () => {
  const { data, error } = await db.auth.getSession();
  if (error) { showLogin(error.message, true); return; }
  await handleSession(data.session);
})();