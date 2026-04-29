// ===== 存储键 =====
const KEYS = {
  timeline: 'love_timeline',
  diaryHis: 'love_diary_his',
  diaryHer: 'love_diary_her',
  photos: 'love_photos',
};

// ===== 工具函数 =====
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}

function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); }
  catch (e) { alert('存储空间不足，请删除一些旧内容～'); }
}

function formatTime() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function pad(n) { return String(n).padStart(2, '0'); }

// ===== 浮动粒子 =====
function createParticles() {
  const container = $('#particles');
  const emojis = ['🌸', '💕', '✨', '💗', '🩷', '🦋', '⭐', '💖'];
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('span');
    el.className = 'particle';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = Math.random() * 100 + '%';
    el.style.animationDuration = (5 + Math.random() * 8) + 's';
    el.style.animationDelay = Math.random() * 6 + 's';
    el.style.fontSize = (14 + Math.random() * 18) + 'px';
    container.appendChild(el);
  }
}

// ===== 实时时钟 =====
function updateClock() {
  const now = new Date();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekDays[now.getDay()]}`;
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  if ($('#clockDate')) $('#clockDate').textContent = dateStr;
  if ($('#clockTime')) $('#clockTime').textContent = timeStr;
}

// ===== 导航 =====
function initNav() {
  const toggle = $('#navToggle');
  const links = $('#navLinks');
  toggle.addEventListener('click', () => links.classList.toggle('open'));

  $$('[data-nav]').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });

  const sections = $$('section[id]');
  const navItems = $$('[data-nav]');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
      if (scrollY >= s.offsetTop - 200) current = s.id;
    });
    navItems.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  });
}

// ===== 滚动动画 =====
function initScrollAnim() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.tl-item, .fade-up').forEach(el => observer.observe(el));
}

// ===== 时间线 =====
function renderTimeline() {
  const items = load(KEYS.timeline);
  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  const container = $('#timelineContainer');
  container.innerHTML = items.map(item => `
    <div class="tl-item">
      <div class="tl-dot"></div>
      <div class="tl-card">
        <div class="tl-date">${item.date}</div>
        <div class="tl-title">${escHtml(item.title)}</div>
        ${item.desc ? `<div class="tl-desc">${escHtml(item.desc)}</div>` : ''}
        <button class="tl-del" data-tl-id="${item.id}">🗑</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.tl-del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.tlId;
      const items = load(KEYS.timeline);
      save(KEYS.timeline, items.filter(it => it.id !== id));
      renderTimeline();
      initScrollAnim();
    });
  });

  document.querySelectorAll('.tl-item').forEach(el => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.15 });
    observer.observe(el);
  });
}

function initTimelineAdd() {
  $('#tlAddBtn').addEventListener('click', () => {
    const date = $('#tlDate').value;
    const title = $('#tlTitle').value.trim();
    const desc = $('#tlDesc').value.trim();

    if (!date || !title) { alert('请填写日期和标题～'); return; }

    const items = load(KEYS.timeline);
    items.push({ id: uid(), date, title, desc });
    save(KEYS.timeline, items);
    renderTimeline();
    initScrollAnim();
    $('#tlDate').value = '';
    $('#tlTitle').value = '';
    $('#tlDesc').value = '';
  });
}

// ===== 双人日记 =====
function renderDiary(person, listEl) {
  const key = person === 'his' ? KEYS.diaryHis : KEYS.diaryHer;
  const entries = load(key);
  entries.sort((a, b) => b.time.localeCompare(a.time));
  listEl.innerHTML = entries.map(e => `
    <div class="diary-entry">
      <div class="de-time">${e.time}</div>
      <div class="de-content">${escHtml(e.content)}</div>
      <button class="de-del" data-did="${e.id}">🗑</button>
    </div>
  `).join('');

  listEl.querySelectorAll('.de-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.did;
      const items = load(key);
      save(key, items.filter(it => it.id !== id));
      renderDiary(person, listEl);
    });
  });
}

function initDiary(person, inputEl, addBtn, listEl) {
  addBtn.addEventListener('click', () => {
    const content = inputEl.value.trim();
    if (!content) { alert('写点什么吧～'); return; }
    const key = person === 'his' ? KEYS.diaryHis : KEYS.diaryHer;
    const entries = load(key);
    entries.push({ id: uid(), content, time: formatTime() });
    save(key, entries);
    renderDiary(person, listEl);
    inputEl.value = '';
  });
}

// ===== 照片墙 =====
function renderPhotos() {
  const photos = load(KEYS.photos);
  const grid = $('#photoGrid');
  grid.innerHTML = photos.map(p => `
    <div class="photo-card" data-pid="${p.id}">
      <img src="${p.data}" alt="photo">
    </div>
  `).join('');

  grid.querySelectorAll('.photo-card').forEach(card => {
    card.addEventListener('click', () => openPhotoModal(card.dataset.pid));
  });
}

function openPhotoModal(pid) {
  const photos = load(KEYS.photos);
  const photo = photos.find(p => p.id === pid);
  if (!photo) return;
  const modal = $('#photoModal');
  $('#modalImg').src = photo.data;
  modal.classList.add('active');
  modal._photoId = pid;
  document.body.style.overflow = 'hidden';
}

function initPhotos() {
  $('#photoInput').addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const photos = load(KEYS.photos);
    if (photos.length + files.length > 50) {
      alert('照片太多啦，最多存储50张～');
      return;
    }

    let loaded = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        photos.push({ id: uid(), data: reader.result, time: formatTime() });
        loaded++;
        if (loaded === files.length) {
          save(KEYS.photos, photos);
          renderPhotos();
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  });

  $('#modalClose').addEventListener('click', closeModal);
  $('#photoModal').addEventListener('click', (e) => {
    if (e.target === $('#photoModal')) closeModal();
  });
  $('#modalDel').addEventListener('click', () => {
    if (!confirm('确定删除这张照片吗？')) return;
    const photos = load(KEYS.photos);
    save(KEYS.photos, photos.filter(p => p.id !== $('#photoModal')._photoId));
    renderPhotos();
    closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function closeModal() {
  $('#photoModal').classList.remove('active');
  document.body.style.overflow = '';
}

// ===== AI Chat =====
function initChat() {
  const messages = $('#chatMessages');
  const input = $('#chatInput');
  const sendBtn = $('#chatSend');

  function addMessage(text, type) {
    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    input.value = '';
    sendToAI(text).then(reply => addMessage(reply, 'bot'));
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

// 🤖 AI Chat — 调后端 /api/chat 代理（key 在后端 .env 中，不暴露到前端）
const chatHistory = [];

async function sendToAI(message) {
  chatHistory.push({ role: 'user', content: message });
  while (chatHistory.length > 20) chatHistory.shift();

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: chatHistory }),
  });

  if (!res.ok) {
    chatHistory.pop();
    return '呜呜，小助手好像走神了…请稍后重试～ 💦';
  }

  const data = await res.json();
  chatHistory.push({ role: 'assistant', content: data.reply });
  return data.reply;
}

// ===== 工具：转义 HTML =====
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== 启动 =====
function init() {
  createParticles();
  updateClock();
  setInterval(updateClock, 1000);
  initNav();
  initScrollAnim();
  initTimelineAdd();
  renderTimeline();
  initDiary('his', $('#diaryHisInput'), $('#diaryHisAdd'), $('#diaryHisList'));
  initDiary('her', $('#diaryHerInput'), $('#diaryHerAdd'), $('#diaryHerList'));
  renderDiary('his', $('#diaryHisList'));
  renderDiary('her', $('#diaryHerList'));
  initPhotos();
  renderPhotos();
  initChat();
}

document.addEventListener('DOMContentLoaded', init);
