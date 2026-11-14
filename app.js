const STORAGE_KEY = "rentevent_mvp_v1";

const seedItems = [
  {id:"eq1",title:"Комплект LED PAR 18×10W",category:"Свет",price:1800,city:"Санкт-Петербург",owner:"Event Light",description:"Комплект из 4 световых приборов для подсветки зала и декора.",symbol:"✳",available:true},
  {id:"eq2",title:"Проектор Full HD 4500 lm",category:"Видео",price:2200,city:"Санкт-Петербург",owner:"ProVideo",description:"Проектор для презентаций, свадебных экранов и видеоконтента.",symbol:"▣",available:true},
  {id:"eq3",title:"Генератор тяжёлого дыма",category:"Эффекты",price:3500,city:"Санкт-Петербург",owner:"Stage FX",description:"Генератор эффекта низкого дыма для первого танца и шоу.",symbol:"≋",available:true},
  {id:"eq4",title:"Акустическая система 2×500W",category:"Звук",price:2800,city:"Санкт-Петербург",owner:"Sound Lab",description:"Пара активных колонок для камерных мероприятий и презентаций.",symbol:"◖",available:true},
  {id:"eq5",title:"Комплект uplight 8 шт.",category:"Свет",price:2400,city:"Санкт-Петербург",owner:"Light Point",description:"Беспроводные LED-приборы для архитектурной подсветки.",symbol:"✧",available:true},
  {id:"eq6",title:"Экран мобильный 120″",category:"Видео",price:900,city:"Санкт-Петербург",owner:"ProVideo",description:"Мобильный проекционный экран на треноге.",symbol:"▤",available:true}
];

function loadState(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {items:seedItems,bookings:[]}; }
  catch { return {items:seedItems,bookings:[]}; }
}
let state = loadState();
function saveState(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }
const $ = id => document.getElementById(id);
const rub = n => new Intl.NumberFormat("ru-RU").format(n) + " ₽";
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

function renderCatalog(){
  const query=$("searchInput").value.trim().toLowerCase();
  const category=$("categoryFilter").value;
  const sort=$("sortFilter").value;
  let items=state.items.filter(x=>(category==="all"||x.category===category) && (x.title+" "+x.description+" "+x.category).toLowerCase().includes(query));
  if(sort==="price") items.sort((a,b)=>a.price-b.price);
  $("catalogGrid").innerHTML=items.map(item=>`
    <article class="item-card">
      <div class="item-visual"><span class="tag">${escapeHTML(item.category.toUpperCase())}</span><span class="symbol">${escapeHTML(item.symbol||"◈")}</span></div>
      <div class="item-info">
        <div class="item-meta"><span>${escapeHTML(item.city)}</span><span>● доступно для заявки</span></div>
        <h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.description)}</p>
        <div class="item-bottom"><div class="price">${rub(item.price)} <small>/ сутки</small></div><button class="text-btn" data-book="${escapeHTML(item.id)}">ЗАБРОНИРОВАТЬ ↗</button></div>
      </div>
    </article>`).join("");
  $("emptyState").classList.toggle("hidden",items.length!==0);
  $("bookingCount").textContent=state.bookings.length;
}
function openModal(html){$("modalContent").innerHTML=html;$("modalBackdrop").classList.remove("hidden");}
function closeModal(){$("modalBackdrop").classList.add("hidden");}
function showToast(message){const t=$("toast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300);}

function bookingModal(id){
  const item=state.items.find(x=>x.id===id); if(!item)return;
  const today=new Date().toISOString().slice(0,10);
  openModal(`<p class="eyebrow">ЗАЯВКА НА АРЕНДУ</p><h2 id="modalTitle">${escapeHTML(item.title)}</h2>
    <div class="summary"><strong>${rub(item.price)} <small>/ сутки</small></strong><p>${escapeHTML(item.city)} · Владелец: ${escapeHTML(item.owner)}</p></div>
    <form class="booking-form" id="bookingForm" data-item="${escapeHTML(id)}">
      <div class="form-row"><label>Дата получения<input name="start" type="date" min="${today}" required></label><label>Дата возврата<input name="end" type="date" min="${today}" required></label></div>
      <label>Ваше имя<input name="name" required placeholder="Как к вам обращаться"></label>
      <label>Телефон или e-mail<input name="contact" required placeholder="+7 900 000-00-00"></label>
      <label>Комментарий (необязательно)<input name="comment" placeholder="Формат мероприятия, время получения..."></label>
      <button class="primary-btn full" type="submit">Отправить заявку <span>↗</span></button>
      <p class="form-hint">Демо-режим: заявка сохранится локально. Оплата и реальная проверка владельца не подключены.</p>
    </form>`);
}
function submitBooking(form){
  const data=new FormData(form), start=data.get("start"), end=data.get("end");
  if(end<start){showToast("Дата возврата не может быть раньше даты получения");return;}
  const item=state.items.find(x=>x.id===form.dataset.item);
  const days=Math.max(1,Math.round((new Date(end)-new Date(start))/86400000)+1);
  const booking={id:"b"+Date.now(),itemId:item.id,itemTitle:item.title,start,end,days,total:item.price*days,name:data.get("name"),contact:data.get("contact"),comment:data.get("comment"),status:"Ожидает подтверждения"};
  state.bookings.unshift(booking);saveState();closeModal();renderCatalog();showToast("Заявка сохранена — бронирование создано");
}
function showBookings(){
  const list=state.bookings;
  openModal(`<p class="eyebrow">ЛИЧНЫЙ КАБИНЕТ / ДЕМО</p><h2 id="modalTitle">Мои бронирования</h2>
  ${list.length?`<div class="booking-list">${list.map(b=>`<div class="booking-row"><strong>${escapeHTML(b.itemTitle)}</strong><span>${b.start} — ${b.end} · ${b.days} дн. · ${rub(b.total)}</span><br><span class="status">${escapeHTML(b.status)}</span></div>`).join("")}</div>`:`<p>Пока нет заявок. Выберите оборудование в каталоге и отправьте первую заявку.</p>`}`);
}
function addEquipment(form){
  const d=new FormData(form);
  const item={id:"user"+Date.now(),title:d.get("title").trim(),category:d.get("category"),price:Number(d.get("price")),city:d.get("city").trim(),owner:"Новый владелец",description:"Предложение добавлено пользователем в локальный демо-каталог.",symbol:"◈",available:true};
  if(!item.title||!item.city||!Number.isFinite(item.price)||item.price<=0)return;
  state.items.push(item);saveState();form.reset();renderCatalog();showToast("Оборудование добавлено в каталог");
}

$("catalogGrid").addEventListener("click",e=>{const btn=e.target.closest("[data-book]");if(btn)bookingModal(btn.dataset.book);});
$("searchInput").addEventListener("input",renderCatalog);
$("categoryFilter").addEventListener("change",renderCatalog);
$("sortFilter").addEventListener("change",renderCatalog);
$("myBookingsBtn").addEventListener("click",showBookings);
$("modalClose").addEventListener("click",closeModal);
$("modalBackdrop").addEventListener("click",e=>{if(e.target===$("modalBackdrop"))closeModal();});
$("modalContent").addEventListener("submit",e=>{if(e.target.id==="bookingForm"){e.preventDefault();submitBooking(e.target);}});
$("ownerForm").addEventListener("submit",e=>{e.preventDefault();addEquipment(e.target);});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
renderCatalog();
