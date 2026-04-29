// ====== API ======
async function api(method, url, body) {
  const opts = { method, headers: {} };
  if (body) opts.headers['Content-Type'] = 'application/json', opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  const d = await r.json();
  if (!r.ok && d.error) throw new Error(d.error);
  return d;
}
function $(s) { return document.querySelector(s); }
function $$(s) { return document.querySelectorAll(s); }
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ====== 密码系统 ======
const TOKENS = { his: null, her: null };

async function checkStatus(person) {
  try {
    const data = await api('GET', `/api/diary/${person}/status`);
    const pwMode = $(`#diary${cap(person)}PwMode`);
    const setupMode = $(`#diary${cap(person)}SetupMode`);
    if (data.individualSet) {
      pwMode.style.display = 'block';
      setupMode.style.display = 'none';
    } else {
      pwMode.style.display = 'none';
      setupMode.style.display = 'block';
    }
  } catch {}
}

async function setPw(person) {
  const input = $(`#diary${cap(person)}NewPwd`);
  const pwd = input.value.trim();
  if (pwd.length < 4) { alert('密码至少4位'); return; }
  try {
    const d = await api('POST', `/api/diary/${person}/set-password`, { password: pwd });
    if (d.token) TOKENS[person] = d.token;
    alert('密码设置成功！');
    checkStatus(person);
  } catch (e) { alert(e.message); }
}

async function verifyPw(person) {
  const input = $(`#diary${cap(person)}Pwd`);
  const pwd = input.value.trim();
  if (!pwd) return;
  try {
    const d = await api('POST', `/api/diary/${person}/verify`, { password: pwd });
    TOKENS[person] = d.token;
    unlockDiary(person);
  } catch { alert('密码错误'); }
}

function unlockDiary(person) {
  $(`#diary${cap(person)}Lock`).classList.add('unlocked');
  $(`#diary${cap(person)}Content`).classList.add('unlocked');
  loadDiary(person);
}

async function loadDiary(person) {
  const token = TOKENS[person];
  if (!token) return;
  try {
    const entries = await api('GET', `/api/diary/${person}/entries?token=${token}`);
    const list = $(`#diary${cap(person)}List`);
    list.innerHTML = entries.map(e =>
      `<div class="diary-entry"><div class="de-time">${esc(e.time)}</div><div class="de-content">${esc(e.content)}</div><button class="de-del" data-p="${person}" data-id="${e.id}">🗑</button></div>`
    ).join('');
    list.querySelectorAll('.de-del').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('确定删除？')) return;
      await api('DELETE', `/api/diary/${b.dataset.p}/entries/${b.dataset.id}?token=${TOKENS[b.dataset.p]}`);
      loadDiary(b.dataset.p);
    }));
  } catch {}
}

async function addEntry(person) {
  const token = TOKENS[person];
  if (!token) { alert('请先解锁'); return; }
  const input = $(`#diary${cap(person)}Input`);
  const content = input.value.trim();
  if (!content) { alert('写点什么吧～'); return; }
  try {
    await api('POST', `/api/diary/${person}/entries`, { token, content });
    input.value = '';
    loadDiary(person);
  } catch { alert('保存失败'); }
}

// ====== 倒计时 ======
function calcDaysUntilNext(dateStr) {
  const parts = dateStr.split('-');
  const m = +parts[1], d = +parts[2];
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), m - 1, d);
  let next;
  if (thisYear >= now) next = thisYear;
  else next = new Date(now.getFullYear() + 1, m - 1, d);
  return Math.ceil((next - now) / (1000 * 60 * 60 * 24));
}

function fmtCountdown(days) {
  if (days === 0) return '🎉 就是今天！';
  if (days < 0) return '';
  const months = Math.floor(days / 30);
  const remain = days % 30;
  let text = '';
  if (months > 0) text += months + '个月';
  text += remain + '天';
  return '⏰ 距下次还有 ' + text;
}

function updateHeroAnnouncements(items) {
  const container = $('#heroAnnounce');
  const upcoming = items
    .map(it => ({ ...it, days: calcDaysUntilNext(it.date) }))
    .filter(it => it.days >= 0 && it.days <= 10)
    .sort((a, b) => a.days - b.days);

  if (!upcoming.length) { container.innerHTML = ''; return; }

  container.innerHTML = upcoming.map(it => {
    const cls = it.days <= 3 ? 'hero-announce-item urgent' : 'hero-announce-item';
    const label = it.days === 0 ? '今天' : it.days + '天后';
    return `<div class="${cls}" onclick="document.getElementById('timeline').scrollIntoView({behavior:'smooth'})">💕 ${label}是「${esc(it.title)}」❤️</div>`;
  }).join('');
}

// ====== 粒子 ======
function createParticles() {
  const c = $('#particles');
  for (const e of ['🌸','💕','✨','💗','🩷','🦋','⭐','💖']) {
    const el = document.createElement('span');
    el.className = 'particle';
    el.textContent = e;
    el.style.left = Math.random() * 100 + '%';
    el.style.animationDuration = (5 + Math.random() * 8) + 's';
    el.style.animationDelay = Math.random() * 6 + 's';
    el.style.fontSize = (14 + Math.random() * 18) + 'px';
    c.appendChild(el);
  }
}

// ====== 时钟 ======
function updateClock() {
  const now = new Date();
  const wd = ['日','一','二','三','四','五','六'];
  if ($('#clockDate')) $('#clockDate').textContent = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 星期${wd[now.getDay()]}`;
  if ($('#clockTime')) $('#clockTime').textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
}

// ====== 导航 ======
function initNav() {
  $('#navToggle').addEventListener('click', () => $('#navLinks').classList.toggle('open'));
  $$('[data-nav]').forEach(a => a.addEventListener('click', () => $('#navLinks').classList.remove('open')));
  const ss = $$('section[id]'), ns = $$('[data-nav]');
  window.addEventListener('scroll', () => {
    let cur = '';
    ss.forEach(s => { if (scrollY >= s.offsetTop - 200) cur = s.id; });
    ns.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
  });
}

// ====== 滚动动画 ======
function initScrollAnim() {
  const ob = new IntersectionObserver(e => { e.forEach(x => { if (x.isIntersecting) x.target.classList.add('visible'); }); }, { threshold: 0.15 });
  document.querySelectorAll('.tl-item, .fade-up').forEach(el => ob.observe(el));
}

// ====== 时间线 ======
async function renderTimeline() {
  try {
    const items = await api('GET', '/api/timeline');
    const container = $('#timelineContainer');
    container.innerHTML = items.map(item => {
      const days = calcDaysUntilNext(item.date);
      const cdText = fmtCountdown(days);
      const urgentCls = days >= 0 && days <= 10 ? ' urgent' : '';
      return `<div class="tl-item"><div class="tl-dot"></div><div class="tl-card"><div class="tl-date">${item.date}</div><div class="tl-title">${esc(item.title)}</div>${item.desc ? `<div class="tl-desc">${esc(item.desc)}</div>` : ''}${cdText ? `<div class="tl-countdown${urgentCls}">${cdText}</div>` : ''}<button class="tl-del" data-id="${item.id}">🗑</button></div></div>`;
    }).join('');
    container.querySelectorAll('.tl-del').forEach(b => b.addEventListener('click', async e => {
      e.stopPropagation();
      await api('DELETE', `/api/timeline/${b.dataset.id}`);
      renderTimeline();
    }));
    initScrollAnim();
    updateHeroAnnouncements(items);
  } catch {}
}

function initTL() {
  $('#tlAddBtn').addEventListener('click', async () => {
    const date = $('#tlDate').value, title = $('#tlTitle').value.trim(), desc = $('#tlDesc').value.trim();
    if (!date || !title) { alert('请填写日期和标题～'); return; }
    try {
      await api('POST', '/api/timeline', { date, title, desc });
      renderTimeline();
      $('#tlDate').value = ''; $('#tlTitle').value = ''; $('#tlDesc').value = '';
    } catch { alert('添加失败'); }
  });
}

// ====== 照片墙 ======
async function renderPhotos() {
  try {
    const photos = await api('GET', '/api/photos');
    $('#photoGrid').innerHTML = photos.map(p => `<div class="photo-card" data-pid="${p.id}"><img src="${p.url}" alt="photo"></div>`).join('');
    $('#photoGrid').querySelectorAll('.photo-card').forEach(c => c.addEventListener('click', () => {
      $('#modalImg').src = c.querySelector('img').src;
      $('#photoModal')._pid = c.dataset.pid;
      $('#photoModal').classList.add('active');
      document.body.style.overflow = 'hidden';
    }));
  } catch {}
}

function initPhotos() {
  $('#photoInput').addEventListener('change', async e => {
    for (const f of Array.from(e.target.files)) {
      const r = new FileReader();
      r.onload = async () => { try { await api('POST', '/api/photos/upload', { data: r.result }); renderPhotos(); } catch {} };
      r.readAsDataURL(f);
    }
    e.target.value = '';
  });
  $('#modalClose').addEventListener('click', () => { $('#photoModal').classList.remove('active'); document.body.style.overflow = ''; });
  $('#photoModal').addEventListener('click', e => { if (e.target === $('#photoModal')) { $('#photoModal').classList.remove('active'); document.body.style.overflow = ''; } });
  $('#modalDel').addEventListener('click', async () => {
    if (!confirm('确定删除？')) return;
    await api('DELETE', `/api/photos/${$('#photoModal')._pid}`);
    renderPhotos();
    $('#photoModal').classList.remove('active');
    document.body.style.overflow = '';
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('#photoModal').classList.remove('active'); document.body.style.overflow = ''; } });
}

// ====== AI 聊天 ======
let curConv = null, chatLoading = false;

async function loadConvs() {
  try {
    const list = await api('GET', '/api/chat/conversations');
    $('#chatHistoryList').innerHTML = list.map(c => `
      <div class="chat-history-item-wrap">
        <div class="chat-history-item ${c.id === curConv ? 'active' : ''}" data-cid="${c.id}">
          ${esc(c.title)}
          <div class="h-time">${c.createdAt.slice(0,16).replace('T',' ')}</div>
        </div>
        <div class="chat-history-actions">
          <button class="ch-rename" data-cid="${c.id}" title="重命名">✏️</button>
          <button class="ch-delete" data-cid="${c.id}" title="删除">🗑</button>
        </div>
      </div>
    `).join('');
    $('#chatHistoryList').querySelectorAll('.chat-history-item').forEach(el => el.addEventListener('click', () => switchConv(el.dataset.cid)));
    $('#chatHistoryList').querySelectorAll('.ch-rename').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); renameConv(b.dataset.cid); }));
    $('#chatHistoryList').querySelectorAll('.ch-delete').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); deleteConv(b.dataset.cid); }));
  } catch {}
}

async function switchConv(id) {
  try {
    const conv = await api('GET', `/api/chat/conversations/${id}`);
    curConv = conv.id;
    const el = $('#chatMessages');
    el.innerHTML = conv.messages.map(m => `<div class="chat-msg ${m.role === 'user' ? 'user' : 'bot'}">${esc(m.content)}</div>`).join('');
    el.scrollTop = el.scrollHeight;
    $('#chatTitle').textContent = conv.title;
    loadConvs();
  } catch {}
}

async function renameConv(id) {
  const t = prompt('请输入新标题：');
  if (!t || !t.trim()) return;
  try {
    await api('PUT', `/api/chat/conversations/${id}`, { title: t.trim() });
    if (id === curConv) $('#chatTitle').textContent = t.trim();
    loadConvs();
  } catch { alert('重命名失败'); }
}

async function deleteConv(id) {
  if (!confirm('确定删除此对话？')) return;
  try {
    await api('DELETE', `/api/chat/conversations/${id}`);
    if (id === curConv) newConv();
    else loadConvs();
  } catch {}
}

async function newConv() {
  const title = '新对话 ' + new Date().toISOString().slice(0, 16).replace('T', ' ');
  try {
    const conv = await api('POST', '/api/chat/conversations', { title });
    curConv = conv.id;
    $('#chatMessages').innerHTML = '<div class="chat-msg bot">你好呀！我是你们的小助手 💕 有什么我可以帮忙的吗？</div>';
    $('#chatTitle').textContent = conv.title;
    loadConvs();
  } catch {}
}

async function sendMsg() {
  const input = $('#chatInput'), text = input.value.trim();
  if (!text || chatLoading) return;
  if (!curConv) await newConv();
  const el = $('#chatMessages');
  el.innerHTML += `<div class="chat-msg user">${esc(text)}</div>`;
  el.scrollTop = el.scrollHeight;
  input.value = '';
  chatLoading = true;
  $('#chatLoading').style.display = 'block';
  el.scrollTop = el.scrollHeight;
  try {
    const d = await api('POST', `/api/chat/conversations/${curConv}/messages`, { role: 'user', content: text });
    $('#chatLoading').style.display = 'none';
    if (d.reply) {
      el.innerHTML += `<div class="chat-msg bot">${esc(d.reply)}</div>`;
      el.scrollTop = el.scrollHeight;
      loadConvs();
      try { const c = await api('GET', `/api/chat/conversations/${curConv}`); $('#chatTitle').textContent = c.title; } catch {}
    } else {
      el.innerHTML += '<div class="chat-msg bot">呜呜，小助手好像走神了…💦</div>';
    }
  } catch {
    $('#chatLoading').style.display = 'none';
    el.innerHTML += '<div class="chat-msg bot">呜呜，出错了…💦</div>';
  }
  chatLoading = false;
}

function initChat() {
  $('#chatSend').addEventListener('click', sendMsg);
  $('#chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });
  $('#chatNewBtn').addEventListener('click', newConv);
  $('#chatToggleBtn').addEventListener('click', () => $('#chatSidebar').classList.toggle('open'));
  newConv();
}

// ====== 启动 ======
function init() {
  createParticles();
  updateClock();
  setInterval(updateClock, 1000);
  initNav();
  initScrollAnim();
  initTL();
  renderTimeline();

  ['his', 'her'].forEach(p => {
    checkStatus(p);
    $(`#diary${cap(p)}SetPwdBtn`).addEventListener('click', () => setPw(p));
    $(`#diary${cap(p)}Lock`).querySelector('.diary-pwd-btn').addEventListener('click', () => verifyPw(p));
    $(`#diary${cap(p)}Add`).addEventListener('click', () => addEntry(p));
  });

  initPhotos();
  renderPhotos();
  initChat();
}

document.addEventListener('DOMContentLoaded', init);
