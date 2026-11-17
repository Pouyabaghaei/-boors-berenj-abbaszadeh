const $=id=>document.getElementById(id), fa=n=>Number(n||0).toLocaleString('fa-IR'), money=n=>fa(n)+' ریال';
const seed={users:[{username:'admin',display:'مدیر اصلی',password:'admin123',role:'admin',active:true}],products:[],customers:[],invoices:[],requests:[],session:null};
let db;try{db=JSON.parse(localStorage.getItem('abbasDb'))||seed}catch{db=seed}
let lines=[];
function save(){localStorage.setItem('abbasDb',JSON.stringify(db));render()}
function show(id){['loginView','pendingView','appView'].forEach(x=>$(x).classList.toggle('hidden',x!==id))}
function current(){return db.users.find(u=>u.username===db.session)}
function render(){
 $('statProducts').textContent=fa(db.products.length);$('statCustomers').textContent=fa(db.customers.length);$('statInvoices').textContent=fa(db.invoices.length);
 $('statStock').textContent=fa(db.products.reduce((s,p)=>s+p.stock*p.cost,0));
 $('productRows').innerHTML=db.products.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.group)}</td><td>${fa(p.stock)}</td><td>${money(p.cost)}</td><td>${money(p.sell)}</td></tr>`).join('')||'<tr><td colspan="5">کالایی ثبت نشده است.</td></tr>';
 $('customerRows').innerHTML=db.customers.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.phone)}</td></tr>`).join('')||'<tr><td colspan="2">مشتری ثبت نشده است.</td></tr>';
 $('invoiceProduct').innerHTML='<option value="">انتخاب کالا</option>'+db.products.map((p,i)=>`<option value="${i}">${esc(p.name)}</option>`).join('');
 $('recentInvoices').innerHTML=db.invoices.slice(-5).reverse().map(i=>`<div class="hint">فاکتور ${fa(i.id)} · ${esc(i.customer)} · ${money(i.total)}</div>`).join('')||'هنوز فاکتوری ثبت نشده است.';
 $('requestsList').innerHTML=db.requests.length?db.requests.map((r,i)=>`<div class="request"><b>${esc(r.username)}</b> · ${new Date(r.time).toLocaleString('fa-IR')} <button class="primary" onclick="approve(${i})">تأیید ورود</button> <button class="ghost" onclick="reject(${i})">رد</button></div>`).join('<hr>'):'درخواستی وجود ندارد.';
 $('usersList').innerHTML=db.users.map(u=>`<div class="hint">${esc(u.username)} — ${esc(u.display)} — ${roleName(u.role)} ${u.username!=='admin'?`<button class="ghost" onclick="toggleUser('${esc(u.username)}')">${u.active?'غیرفعال‌سازی':'فعال‌سازی'}</button>`:''}</div>`).join('');
 $('userLabel').textContent=current()?.display||'';
 $('invoiceLines').innerHTML=lines.map((l,i)=>`<tr><td>${esc(l.name)}</td><td>${fa(l.qty)}</td><td>${money(l.price)}</td><td>${money(l.qty*l.price)}</td><td><button class="ghost" onclick="removeLine(${i})">حذف</button></td></tr>`).join('')||'<tr><td colspan="5" class="muted">هنوز کالایی اضافه نشده است.</td></tr>';
 $('invoiceTotal').textContent=money(lines.reduce((s,l)=>s+l.qty*l.price,0));
}
function roleName(r){return r==='admin'?'مدیر':r==='stock'?'انبار و خرید':'فروش و مشتریان'}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
$('loginBtn').onclick=()=>{let u=db.users.find(x=>x.username===$('loginUser').value.trim()&&x.password===$('loginPass').value&&x.active);if(!u){$('loginMessage').textContent='نام کاربری یا رمز عبور نادرست است یا حساب غیرفعال است.';return}if(u.role==='admin'){db.session=u.username;save();show('appView');return}if(!db.requests.some(r=>r.username===u.username)){db.requests.push({username:u.username,time:Date.now()});save()}$('loginMessage').textContent='درخواست برای مدیر ارسال شد.';show('pendingView')};
$('logoutBtn').onclick=()=>{db.session=null;save();show('loginView')};
$('cancelRequest').onclick=()=>show('loginView');
window.approve=i=>{if(current()?.role!=='admin')return alert('فقط مدیر اصلی مجاز است');const r=db.requests.splice(i,1)[0];db.session=r.username;save();show('appView')};
window.reject=i=>{if(current()?.role!=='admin')return;db.requests.splice(i,1);save()};
window.toggleUser=name=>{if(current()?.role!=='admin')return;let u=db.users.find(x=>x.username===name);if(u)u.active=!u.active;save()};
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.page').forEach(x=>x.classList.toggle('hidden',x.id!==b.dataset.page))});
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>document.querySelector(`[data-page="${b.dataset.go}"]`).click());
$('saveProduct').onclick=()=>{let name=$('productName').value.trim();if(!name)return alert('نام کالا را وارد کنید');db.products.push({name,group:$('productGroup').value,stock:+$('productStock').value||0,cost:+$('productCost').value||0,sell:+$('productSell').value||0});['productName','productStock','productCost','productSell'].forEach(x=>$(x).value='');save()};
$('saveCustomer').onclick=()=>{let name=$('customerName').value.trim();if(!name)return alert('نام مشتری را وارد کنید');db.customers.push({name,phone:$('customerPhone').value.trim()});$('customerName').value='';$('customerPhone').value='';save()};
$('createUser').onclick=()=>{if(current()?.role!=='admin')return alert('فقط مدیر مجاز است');let username=$('newUsername').value.trim(),password=$('newPassword').value;if(!username||!password)return alert('نام کاربری و رمز لازم است');if(db.users.some(u=>u.username===username))return alert('این نام کاربری قبلاً ثبت شده');db.users.push({username,display:$('newDisplay').value.trim()||username,password,role:$('newRole').value,active:true});['newUsername','newDisplay','newPassword'].forEach(x=>$(x).value='');save()};
$('addLine').onclick=()=>{let i=$('invoiceProduct').value,qty=+$('invoiceQty').value,price=+$('invoicePrice').value;if(i===''||qty<=0||price<0)return alert('کالا، مقدار و قیمت را بررسی کنید');let p=db.products[+i];lines.push({name:p.name,qty,price,productIndex:+i});render()};
window.removeLine=i=>{lines.splice(i,1);render()};
$('confirmInvoice').onclick=()=>{if(!lines.length)return alert('فاکتور خالی است');let customer=$('invoiceCustomer').value.trim()||'مشتری نقدی',phone=$('invoicePhone').value.trim(),total=lines.reduce((s,l)=>s+l.qty*l.price,0);let inv={id:Date.now(),customer,phone,lines:[...lines],total,note:$('invoiceNote').value,time:new Date().toISOString()};db.invoices.push(inv);lines.forEach(l=>{let p=db.products[l.productIndex];if(p)p.stock=Math.max(0,p.stock-l.qty)});save();lines=[];$('invoiceCustomer').value='';$('invoicePhone').value='';$('invoiceNote').value='';alert('فاکتور ثبت شد. ارسال پیامک تا زمان اتصال سرویس پیامک فعال نیست.');};
$('printInvoice').onclick=()=>window.print();
$('exportData').onclick=()=>{let a=document.createElement('a'),blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});a.href=URL.createObjectURL(blob);a.download='abbaszadeh-backup.json';a.click();URL.revokeObjectURL(a.href)};
$('importData').onchange=async e=>{try{let x=JSON.parse(await e.target.files[0].text());if(!x.users||!x.products)throw 0;db=x;save();alert('بازیابی انجام شد')}catch{alert('فایل پشتیبان معتبر نیست')}};
render();if(db.session&&current()){show('appView')}else show('loginView');
