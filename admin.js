// COMRADE MKT CEO portal. Admin membership is verified through public.admin_users.
const SUPABASE_URL='https://kmkfexumqgutclcsqlja.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_9-v-BWV98TFsUxXT7zSVPg_NoxTGTjL';
const {createClient}=window.supabase;
const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const loginPanel=document.getElementById('loginPanel'),dashboard=document.getElementById('dashboard'),loginForm=document.getElementById('loginForm'),loginMessage=document.getElementById('loginMessage'),logoutButton=document.getElementById('logoutButton'),listingMessage=document.getElementById('listingMessage'),listingRows=document.getElementById('listingRows');
const money=v=>'KES '+Number(v||0).toLocaleString('en-KE');
function showLogin(message='',isError=false){dashboard.classList.add('hidden');loginPanel.classList.remove('hidden');logoutButton.classList.add('hidden');loginMessage.textContent=message;loginMessage.className='message'+(message?(isError?' error':' success'):'');}
function showDashboard(user){loginPanel.classList.add('hidden');dashboard.classList.remove('hidden');logoutButton.classList.remove('hidden');document.getElementById('welcomeText').textContent='Signed in as '+(user.email||'CEO administrator')+'.';}
async function verifyAdmin(user){const {data,error}=await db.from('admin_users').select('id').eq('id',user.id).maybeSingle();if(error)throw new Error('Could not verify administrator access: '+error.message);if(!data)throw new Error('This account is not registered as a COMRADE MKT administrator.');}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function metric(id,v){document.getElementById(id).textContent=v==null?'—':Number(v).toLocaleString('en-KE');}
async function loadDashboardData(){
 const refresh=document.getElementById('refreshButton');refresh.disabled=true;listingMessage.textContent='Loading marketplace figures…';listingMessage.className='message';
 const [pr,ar,sr,ur]=await Promise.all([db.from('products').select('id,title,price,category,seller_id,status,created_at',{count:'exact'}).order('created_at',{ascending:false}).limit(50),db.from('products').select('id',{count:'exact',head:true}).eq('status','active'),db.from('products').select('id',{count:'exact',head:true}).eq('status','sold'),db.from('profiles').select('id',{count:'exact',head:true})]);
 refresh.disabled=false;
 if(pr.error){listingMessage.textContent='Could not load listings: '+pr.error.message+'. Check the dashboard database setup.';listingMessage.className='message error';return;}
 if(ar.error||sr.error||ur.error){const issue=[ar.error,sr.error,ur.error].filter(Boolean)[0];listingMessage.textContent='Some overview figures are unavailable: '+issue.message+'. Check the dashboard database setup.';listingMessage.className='message error';}
 const items=pr.data||[];
 metric('totalCount',pr.count??items.length);metric('activeCount',ar.error?null:(ar.count??0));metric('soldCount',sr.error?null:(sr.count??0));metric('studentCount',ur.error?null:(ur.count??0));
 listingRows.innerHTML=items.map(x=>{const s=String(x.status||'unknown').toLowerCase();const cls=['active','sold','removed'].includes(s)?'status-'+s:'';return '<tr><td>'+escapeHtml(x.title)+'</td><td>'+money(x.price)+'</td><td>'+escapeHtml(x.category||'Other')+'</td><td>'+escapeHtml(String(x.seller_id||'').slice(0,8))+'…</td><td><span class="status-pill '+cls+'">'+escapeHtml(s)+'</span></td></tr>';}).join('');
 if(!items.length)listingRows.innerHTML='<tr><td colspan="5">No marketplace listings found.</td></tr>';
 if(!pr.error&&!ar.error&&!sr.error&&!ur.error){listingMessage.textContent='Overview updated successfully. Showing the latest '+items.length+' listings.';listingMessage.className='message success';}
 document.getElementById('lastUpdated').textContent='Updated '+new Date().toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'});
}
async function handleSession(session){if(!session?.user){showLogin();return;}try{await verifyAdmin(session.user);showDashboard(session.user);await loadDashboardData();}catch(e){await db.auth.signOut();showLogin(e.message,true);}}
loginForm.addEventListener('submit',async e=>{e.preventDefault();const b=document.getElementById('loginSubmit'),f=new FormData(loginForm);b.disabled=true;b.textContent='Verifying…';loginMessage.textContent='';const {data,error}=await db.auth.signInWithPassword({email:String(f.get('email')).trim(),password:String(f.get('password'))});b.disabled=false;b.textContent='Sign in securely';if(error){showLogin(error.message,true);return;}await handleSession(data.session);});
logoutButton.addEventListener('click',async()=>{await db.auth.signOut();showLogin('You have signed out.');});
document.getElementById('refreshButton').addEventListener('click',loadDashboardData);
db.auth.onAuthStateChange((_event,session)=>{if(!session)showLogin();});
(async()=>{const {data,error}=await db.auth.getSession();if(error){showLogin(error.message,true);return;}await handleSession(data.session);})();