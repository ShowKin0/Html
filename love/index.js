// ====== API 工具 ======
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
let resetPerson = null; // 记录正在重置的是谁的密码

async function checkStatus(person) {
  try {
    const data = await api('GET', `/api/diary/${person}/status`);
    const pwMode = $(`#diary${cap(person)}PwMode`);
    const setupMode = $(`#diary${cap(person)}SetupMode`);
    if (data.masterSet || data.individualSet) {
      pwMode.style.display = 'block';
      setupMode.style.display = 'none';
      if (data.masterSet) $('#masterInfo').style.display = 'block';
      if (data.individualSet && !data.masterSet) checkMasterReady();
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
    checkMasterReady();
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

// 忘记密码 → 显示重置弹窗
function showReset(person) {
  resetPerson = person;
  $('#resetModalTitle').textContent = `🔑 重置${person === 'his' ? '他' : '她'}的密码`;
  $('#resetMasterPw').value = '';
  $('#resetNewPw').value = '';
  $('#resetModal').classList.add('active');
}

async function confirmReset() {
  const person = resetPerson;
  const masterPw = $('#resetMasterPw').value.trim();
  const newPw = $('#resetNewPw').value.trim();
  if (!masterPw) { alert('请输入万能密码'); return; }
  if (newPw.length < 4) { alert('新密码至少4位'); return; }
  try {
    const d = await api('POST', `/api/diary/${person}/reset-password`, { masterPassword: masterPw, newPassword: newPw });
    if (d.token) TOKENS[person] = d.token;
    alert('密码已重置！');
    $('#resetModal').classList.remove('active');
    unlockDiary(person);
  } catch (e) { alert(e.message); }
}

// 万能密码
async function checkMasterReady() {
  try {
    const h = await api('GET', '/api/diary/his/status');
    const e = await api('GET', '/api/diary/her/status');
    if (h.masterSet || e.masterSet) {
      $('#masterActivate').style.display = 'none';
      $('#masterInfo').style.display = 'block';
      return;
    }
    $('#masterActivate').style.display = (h.individualSet && e.individualSet) ? 'block' : 'none';
  } catch {}
}

async function setMaster() {
  const masterPw = $('#masterNewPw').value.trim();
  const hisPw = $('#masterConfirmHisPw').value.trim();
  const herPw = $('#masterConfirmHerPw').value.trim();
  if (masterPw.length < 4) { alert('万能密码至少4位'); return; }
  if (!hisPw || !herPw) { alert('请输入双方个人密码确认'); return; }
  try {
    await api('POST', '/api/diary/set-master', { masterPassword: masterPw, hisPassword: hisPw, herPassword: herPw });
    alert('万能密码已激活！可用于重置忘记的个人密码。');
    $('#masterActivate').style.display = 'none';
    $('#masterInfo').style.display = 'block';
  } catch (e) { alert(e.message); }
}

// ====== 粒子 ======
function createParticles() {
  const c = $('#particles');
  const emojis = ['🌸', '💕', '✨', '💗', '🩷', '🦋', '⭐', '💖'];
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('span');
    el.className = 'particle';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
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
  const sections = $$('section[id]'), navItems = $$('[data-nav]');
  window.addEventListener('scroll', () => {
    let cur = '';
    sections.forEach(s => { if (scrollY >= s.offsetTop - 200) cur = s.id; });
    navItems.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
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
    $('#timelineContainer').innerHTML = items.map(item =>
      `<div class="tl-item"><div class="tl-dot"></div><div class="tl-card"><div class="tl-date">${item.date}</div><div class="tl-title">${esc(item.title)}</div>${item.desc ? `<div class="tl-desc">${esc(item.desc)}</div>` : ''}<button class="tl-del" data-id="${item.id}">🗑</button></div></div>`
    ).join('');
    $('#timelineContainer').querySelectorAll('.tl-del').forEach(b => b.addEventListener('click', async e => {
      e.stopPropagation();
      await api('DELETE', `/api/timeline/${b.dataset.id}`);
      renderTimeline();
    }));
    initScrollAnim();
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
      const pid = c.dataset.pid;
      const img = c.querySelector('img').src;
      $('#modalImg').src = img;
      $('#photoModal')._pid = pid;
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
  const newTitle = prompt('请输入新标题：');
  if (!newTitle || !newTitle.trim()) return;
  try {
    await api('PUT', `/api/chat/conversations/${id}`, { title: newTitle.trim() });
    if (id === curConv) $('#chatTitle').textContent = newTitle.trim();
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
      el.innerHTML += '<div class="chat-msg bot">呜呜，小助手好像走神了…请稍后重试～ 💦</div>';
    }
  } catch {
    $('#chatLoading').style.display = 'none';
    el.innerHTML += '<div class="chat-msg bot">呜呜，出错了…请稍后重试～ 💦</div>';
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
    $(`#diary${cap(p)}Lock`).querySelector('.diary-pwd-forgot-btn').addEventListener('click', () => showReset(p));
    $(`#diary${cap(p)}Add`).addEventListener('click', () => addEntry(p));
  });

  $('#masterActivateBtn').addEventListener('click', setMaster);
  $('#resetConfirmBtn').addEventListener('click', confirmReset);
  $('#resetCancelBtn').addEventListener('click', () => $('#resetModal').classList.remove('active'));
  $('#resetModal').addEventListener('click', e => { if (e.target === $('#resetModal')) $('#resetModal').classList.remove('active'); });

  initPhotos();
  renderPhotos();
  initChat();
}

document.addEventListener('DOMContentLoaded', init);
