# 文章评论功能 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 SK 小站的文章系统添加评论功能，访客可发表/限时删除评论，后台可管理所有评论。

**Architecture:** 纯前端方案，评论数据独立存储于 localStorage `sk_comments`，按 `articleId` 关联文章。访客浏览器生成唯一 `visitorId`，用于 3 分钟内删除权限判断。后台读取所有评论并按文章分组管理。

**Tech Stack:** HTML + CSS + JavaScript (Vanilla), localStorage

---

### Task 1: 前端 — 访客 ID 初始化 + 评论数据层

**Files:**
- Modify: `index.js` (在 `initLearn` IIFE 内部新增函数)

- [ ] **Step 1: 在 index.js 中新增 visitorId 初始化和评论数据函数**

在 `initLearn` IIFE 内的 `loadArticles` 函数之前，插入以下代码：

```js
// ===== 评论系统 =====
const COMMENTS_KEY = 'sk_comments';

// 生成随机 ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// 获取当前访客 ID（不存在则生成）
function getVisitorId() {
    let id = localStorage.getItem('sk_visitor_id');
    if (!id) {
        id = generateId() + generateId();
        localStorage.setItem('sk_visitor_id', id);
    }
    return id;
}

// 获取所有评论
function getComments() {
    const data = localStorage.getItem(COMMENTS_KEY);
    return data ? JSON.parse(data) : [];
}

// 保存评论
function saveComments(comments) {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
}

// 获取某篇文章的评论（按时间正序）
function getArticleComments(articleId) {
    return getComments()
        .filter(c => c.articleId === articleId)
        .sort((a, b) => a.timestamp - b.timestamp);
}

// 添加评论
function addComment(articleId, nickname, content) {
    const comments = getComments();
    const comment = {
        id: generateId(),
        articleId,
        nickname: nickname.trim(),
        content: content.trim(),
        timestamp: Date.now(),
        visitorId: getVisitorId()
    };
    comments.push(comment);
    saveComments(comments);
    return comment;
}

// 删除评论（按 ID）
function deleteComment(commentId) {
    let comments = getComments();
    comments = comments.filter(c => c.id !== commentId);
    saveComments(comments);
}

// 删除某文章的所有评论
function deleteArticleComments(articleId) {
    let comments = getComments();
    comments = comments.filter(c => c.articleId !== articleId);
    saveComments(comments);
}
```

- [ ] **Step 2: 测试加载页面确保无报错**

打开 `index.html`，浏览器控制台确认没有 JS 错误。

- [ ] **Step 3: 提交**

```bash
git add index.js
git commit -m "feat: add comment data layer and visitor ID"
```

---

### Task 2: 前端 — 评论区渲染 + 评论表单

**Files:**
- Modify: `index.js`
- Modify: `index.css`

- [ ] **Step 1: 在 index.js 的 `openArticle` 函数中，渲染评论列表和表单**

在 `modalBody.innerHTML = article.content;` 之后，添加评论区的渲染：

```js
// 渲染评论区
renderComments(article.id);
```

在 `closeModal` 函数之前，新增评论渲染和表单提交函数：

```js
// 渲染评论区
function renderComments(articleId) {
    const container = document.getElementById('modalComments');
    // 移除旧的评论区
    const old = modal.querySelector('.comment-section');
    if (old) old.remove();

    const section = document.createElement('div');
    section.className = 'comment-section';

    // 分割线
    const divider = document.createElement('div');
    divider.className = 'comment-divider';
    section.appendChild(divider);

    // 评论标题
    const title = document.createElement('h3');
    title.className = 'comment-heading';
    title.textContent = '评论';
    section.appendChild(title);

    // 评论列表
    const list = document.createElement('div');
    list.className = 'comment-list';
    list.id = 'commentList';

    const comments = getArticleComments(articleId);
    if (comments.length === 0) {
        list.innerHTML = '<p class="comment-empty">暂无评论，来说两句吧</p>';
    } else {
        const visitorId = getVisitorId();
        const now = Date.now();
        comments.forEach(c => {
            const item = document.createElement('div');
            item.className = 'comment-item';
            item.dataset.id = c.id;

            const canDelete = c.visitorId === visitorId && (now - c.timestamp < 180000);

            item.innerHTML = `
                <div class="comment-header">
                    <span class="comment-nickname">${escapeHtml(c.nickname)}</span>
                    <span class="comment-time">${formatCommentTime(c.timestamp)}</span>
                </div>
                <div class="comment-body">${escapeHtml(c.content)}</div>
                ${canDelete ? '<button class="comment-delete" data-id="' + c.id + '">删除</button>' : ''}
            `;
            list.appendChild(item);
        });
    }
    section.appendChild(list);

    // 评论表单
    const form = document.createElement('div');
    form.className = 'comment-form';
    form.innerHTML = `
        <input type="text" class="comment-input" id="commentNickname" placeholder="昵称" maxlength="20">
        <textarea class="comment-textarea" id="commentContent" placeholder="写下你的评论..." rows="2" maxlength="500"></textarea>
        <button class="comment-submit" id="commentSubmit">发表评论</button>
    `;
    section.appendChild(form);

    // 历史昵称回填
    const savedNick = localStorage.getItem('sk_comment_nickname');
    if (savedNick) {
        const nickInput = form.querySelector('#commentNickname');
        nickInput.value = savedNick;
    }

    modalBody.appendChild(section);

    // 绑定表单提交
    form.querySelector('#commentSubmit').addEventListener('click', function() {
        const nickInput = form.querySelector('#commentNickname');
        const contentInput = form.querySelector('#commentContent');
        const nickname = nickInput.value.trim();
        const content = contentInput.value.trim();

        if (!nickname) { showCommentToast('请输入昵称'); nickInput.focus(); return; }
        if (!content) { showCommentToast('请输入评论内容'); contentInput.focus(); return; }

        addComment(articleId, nickname, content);
        localStorage.setItem('sk_comment_nickname', nickname);
        contentInput.value = '';
        renderComments(articleId);
        showCommentToast('评论发表成功');
    });

    // 绑定删除按钮事件
    list.querySelectorAll('.comment-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            if (confirm('确定要删除这条评论吗？')) {
                deleteComment(id);
                renderComments(articleId);
            }
        });
    });
}

// 格式化评论时间
function formatCommentTime(timestamp) {
    const d = new Date(timestamp);
    const pad = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
        + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

// 评论提示 Toast
function showCommentToast(msg) {
    let toast = document.querySelector('.comment-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'comment-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2000);
}
```

同时需要在 `openArticle` 中找到 `modalBody.innerHTML = article.content;` 这一行，在其后面加上 `renderComments(article.id);`

- [ ] **Step 2: 在 index.css 末尾添加评论区样式**

```css
/* ===== 评论区 ===== */
.comment-section {
    margin-top: 30px;
}

.comment-divider {
    height: 1px;
    background: #e0e0e0;
    margin-bottom: 20px;
}

.comment-heading {
    font-size: 18px;
    color: #333;
    margin-bottom: 15px;
}

.comment-list {
    margin-bottom: 20px;
}

.comment-empty {
    text-align: center;
    color: #aaa;
    font-size: 14px;
    padding: 20px 0;
}

.comment-item {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 10px;
    position: relative;
}

.comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.comment-nickname {
    font-weight: 600;
    font-size: 14px;
    color: #555;
}

.comment-time {
    font-size: 12px;
    color: #aaa;
}

.comment-body {
    font-size: 14px;
    color: #444;
    line-height: 1.6;
    word-break: break-word;
}

.comment-delete {
    position: absolute;
    bottom: 8px;
    right: 12px;
    background: none;
    border: none;
    color: #e74c3c;
    font-size: 12px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    transition: background 0.2s;
}

.comment-delete:hover {
    background: rgba(231, 76, 60, 0.1);
}

.comment-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.comment-input {
    width: 100%;
    max-width: 250px;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 13px;
    outline: none;
    transition: border-color 0.3s;
}

.comment-input:focus {
    border-color: #667eea;
}

.comment-textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 13px;
    resize: vertical;
    outline: none;
    font-family: inherit;
    transition: border-color 0.3s;
}

.comment-textarea:focus {
    border-color: #667eea;
}

.comment-submit {
    align-self: flex-end;
    padding: 8px 20px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 20px;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.3s;
}

.comment-submit:hover {
    background: #5a6fd6;
}

.comment-toast {
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.75);
    color: white;
    padding: 10px 24px;
    border-radius: 25px;
    font-size: 14px;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
}

.comment-toast.show {
    opacity: 1;
}

/* 移动端评论区适配 */
@media (max-width: 768px) {
    .comment-input {
        max-width: none;
    }
}
```

- [ ] **Step 3: 提交**

```bash
git add index.js index.css
git commit -m "feat: add comment UI in article modal"
```

---

### Task 3: 后台 — 评论管理面板

**Files:**
- Modify: `admin/admin.html`
- Modify: `admin/admin.css`
- Modify: `admin/admin.js`

- [ ] **Step 1: 在 admin.html 的文章列表之后添加评论管理 section**

在 `</section>` (文章列表结束) 和 `</div>` (admin-container 结束) 之间插入：

```html
<!-- 评论管理 -->
<section class="panel">
    <h2>评论管理</h2>
    <div id="commentPanel">
        <p class="empty-tip">暂无评论</p>
    </div>
</section>
```

- [ ] **Step 2: 在 admin.js 中添加评论管理逻辑**

在文件末尾添加：

```js
// ===== 评论管理 =====
const COMMENTS_KEY = 'sk_comments';

function getAllComments() {
    const data = localStorage.getItem(COMMENTS_KEY);
    return data ? JSON.parse(data) : [];
}

function saveAllComments(comments) {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
}

function renderCommentManagement() {
    const panel = document.getElementById('commentPanel');
    const comments = getAllComments();
    const articles = getArticles();

    if (comments.length === 0) {
        panel.innerHTML = '<p class="empty-tip">暂无评论</p>';
        return;
    }

    // 按文章分组
    const grouped = {};
    comments.forEach(c => {
        if (!grouped[c.articleId]) grouped[c.articleId] = { comments: [] };
        grouped[c.articleId].comments.push(c);
    });

    let html = '';
    for (const articleId in grouped) {
        const article = articles.find(a => a.id === articleId);
        const articleTitle = article ? escapeHtml(article.title) : '(文章已删除)';
        const group = grouped[articleId];

        html += `<div class="comment-group">`;
        html += `<h3 class="comment-group-title">${articleTitle}</h3>`;

        group.comments.forEach(c => {
            const time = new Date(c.timestamp);
            const pad = n => String(n).padStart(2, '0');
            const timeStr = time.getFullYear() + '-' + pad(time.getMonth() + 1) + '-' + pad(time.getDate())
                + ' ' + pad(time.getHours()) + ':' + pad(time.getMinutes());

            html += `
                <div class="comment-group-item">
                    <div class="comment-group-meta">
                        <strong>${escapeHtml(c.nickname)}</strong>
                        <span>${timeStr}</span>
                    </div>
                    <div class="comment-group-content">${escapeHtml(c.content)}</div>
                    <button class="btn-danger btn-sm" onclick="adminDeleteComment('${c.id}', '${escapeHtml(c.nickname)}')">删除</button>
                </div>
            `;
        });

        html += `</div>`;
    }

    panel.innerHTML = html;
}

function adminDeleteComment(id, nickname) {
    if (!confirm(`确定要删除 ${nickname} 的评论吗？`)) return;
    let comments = getAllComments();
    comments = comments.filter(c => c.id !== id);
    saveAllComments(comments);
    renderCommentManagement();
    showToast('评论已删除', 'success');
}

// 覆盖原 deleteArticle 以级联删除评论
const originalDeleteArticle = window.deleteArticle;
function deleteArticle(id) {
    if (!confirm('确定要删除这篇文章吗？')) return;
    // 删除关联评论
    let comments = getAllComments();
    comments = comments.filter(c => c.articleId !== id);
    saveAllComments(comments);
    // 删除文章
    let articles = getArticles();
    articles = articles.filter(a => a.id !== id);
    saveArticles(articles);
    renderArticleList();
    renderCommentManagement();
    showToast('文章及关联评论已删除', 'success');
}

// 初始化时渲染评论管理
renderCommentManagement();
```

注意：需要把原 `deleteArticle` 函数替换掉。找到原函数位置（第 37-45 行），用新的 `deleteArticle` 覆盖。

- [ ] **Step 3: 在 admin.css 中添加评论管理样式**

```css
/* ===== 评论管理 ===== */
.comment-group {
    margin-bottom: 24px;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 16px;
    background: #fafafa;
}

.comment-group-title {
    font-size: 15px;
    color: #333;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eee;
}

.comment-group-item {
    background: white;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 8px;
    position: relative;
    border: 1px solid #eee;
}

.comment-group-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    font-size: 13px;
    color: #888;
}

.comment-group-content {
    font-size: 14px;
    color: #444;
    line-height: 1.6;
    margin-bottom: 8px;
    padding-right: 60px;
    word-break: break-word;
}

.btn-sm {
    padding: 4px 12px;
    font-size: 12px;
}

.comment-group-item .btn-danger {
    position: absolute;
    bottom: 10px;
    right: 12px;
}
```

- [ ] **Step 4: 提交**

```bash
git add admin/admin.html admin/admin.js admin/admin.css
git commit -m "feat: add comment management in admin panel"
```

---

### Task 4: 最终验证

- [ ] **Step 1: 浏览器中打开 index.html 验证以下场景**

1. 打开一篇文章 → 底部显示"暂无评论，来说两句吧"
2. 输入昵称和内容，发表评论 → 评论立即显示
3. 3 分钟内能看到"删除"按钮，点击可删除
4. 刷新页面 → 评论仍在
5. 3 分钟后打开 → 删除按钮消失
6. 切换标签页再回来 → 评论正常

- [ ] **Step 2: 浏览器中打开 admin/admin.html 验证**

1. 能看到所有文章的评论分组
2. 可删除任意评论
3. 删除文章时，该文章的评论也被删除
4. 返回前台确认文章和评论都正确

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: complete comment feature with admin management"
```
