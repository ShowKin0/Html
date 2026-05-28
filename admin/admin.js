const STORAGE_KEY = 'sk_articles';

// ===== 数据操作 =====
function getArticles() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveArticles(articles) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
}

// ===== 文章列表渲染 =====
function renderArticleList() {
    const list = document.getElementById('articleList');
    const articles = getArticles();

    if (articles.length === 0) {
        list.innerHTML = '<p class="empty-tip">暂无文章</p>';
        return;
    }

    list.innerHTML = articles.map(article => `
        <div class="article-item">
            <div class="info">
                <h3>${escapeHtml(article.title)}</h3>
                <div class="meta">${article.date} · ${article.summary.slice(0, 40)}${article.summary.length > 40 ? '...' : ''}</div>
            </div>
            <div class="actions">
                <button class="btn-danger" onclick="deleteArticle('${article.id}')">删除</button>
            </div>
        </div>
    `).join('');
}

// ===== 删除文章（级联删除关联评论） =====
function deleteArticle(id) {
    if (!confirm('确定要删除这篇文章吗？')) return;
    // 删除关联评论
    let comments = getComments();
    comments = comments.filter(c => c.articleId !== id);
    saveComments(comments);
    // 删除文章
    let articles = getArticles();
    articles = articles.filter(a => a.id !== id);
    saveArticles(articles);
    renderArticleList();
    renderCommentManagement();
    showToast('文章及关联评论已删除', 'success');
}

// ===== 发布文章 =====
document.getElementById('articleForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const summary = document.getElementById('summary').value.trim();
    const editor = document.getElementById('editorContent');
    const content = editor.innerHTML.trim();
    if (content === '<br>' || !content) {
        showToast('请填写文章内容', 'error');
        return;
    }
    let date = document.getElementById('date').value;

    if (!title || !summary) {
        showToast('请填写完整信息', 'error');
        return;
    }

    if (!date) {
        const now = new Date();
        date = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0');
    }

    const article = {
        id: Date.now().toString(),
        title,
        summary,
        content,
        date,
        createdAt: Date.now()
    };

    const articles = getArticles();
    articles.unshift(article);
    saveArticles(articles);

    // 清空表单
    this.reset();
    editor.innerHTML = '';
    renderArticleList();
    showToast('文章发布成功！', 'success');
});

// ===== WYSIWYG 编辑器 =====
(function initEditor() {
    const editor = document.getElementById('editorContent');
    const toolbar = document.getElementById('editorToolbar');

    // 文件选择器
    const imgPicker = document.getElementById('filePicker');
    const audioPicker = document.getElementById('audioPicker');
    const filePicker = document.getElementById('fileAttachPicker');

    // 执行命令
    function exec(cmd, val) {
        document.execCommand(cmd, false, val || null);
        editor.focus();
    }

    // 读取文件为 Data URL
    function readFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    // 插入图片
    imgPicker.addEventListener('change', async function() {
        for (const file of this.files) {
            const url = await readFile(file);
            exec('insertImage', url);
        }
        this.value = '';
    });

    // 插入音频
    audioPicker.addEventListener('change', async function() {
        for (const file of this.files) {
            const url = await readFile(file);
            exec('insertHTML', `<audio controls src="${url}"></audio><br>`);
        }
        this.value = '';
    });

    // 插入文件链接
    filePicker.addEventListener('change', async function() {
        for (const file of this.files) {
            const url = await readFile(file);
            const name = file.name;
            exec('insertHTML', `<a href="${url}" target="_blank">📎 ${name}</a><br>`);
        }
        this.value = '';
    });

    // 工具栏命令
    const commands = {
        bold:       () => exec('bold'),
        italic:     () => exec('italic'),
        underline:  () => exec('underline'),
        h1: () => toggleHeading('H1'),
        h2: () => toggleHeading('H2'),
        h3: () => toggleHeading('H3'),
        image:      () => imgPicker.click(),
        audio:      () => audioPicker.click(),
        file:       () => filePicker.click(),
        link: () => {
            const selection = window.getSelection().toString();
            const url = prompt('请输入链接 URL：', 'https://');
            if (url) {
                if (selection) {
                    exec('createLink', url);
                } else {
                    exec('insertHTML', `<a href="${url}" target="_blank">${url}</a>`);
                }
            }
        },
        quote: () => toggleBlock('BLOCKQUOTE'),
        code: () => {
            const pre = findAncestor('PRE');
            if (pre) {
                unwrapToParagraph(pre);
                return;
            }
            const sel = window.getSelection();
            const text = sel.toString().trim();
            if (text) {
                exec('insertHTML', `<pre><code>${escapeHtml(text)}</code></pre>`);
            } else {
                exec('insertHTML', '<pre><code>\n\n</code></pre>');
            }
        },
        ul:         () => exec('insertUnorderedList'),
    };

    // 查找光标所在的最接近的指定标签
    function findAncestor(tag) {
        const sel = window.getSelection();
        if (!sel.rangeCount) return null;
        let node = sel.focusNode;
        while (node && node !== editor) {
            if (node.nodeType === 1 && node.tagName === tag) return node;
            node = node.parentNode;
        }
        return null;
    }

    // 把块级元素替换为 <p>，光标移到末尾
    function unwrapToParagraph(el) {
        const p = document.createElement('p');
        p.innerHTML = el.innerHTML;
        el.parentNode.replaceChild(p, el);
        const range = document.createRange();
        range.selectNodeContents(p);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        editor.focus();
    }

    // 切换标题（点相同的标题还原为段落）
    function toggleHeading(tag) {
        const h = findAncestor(tag);
        if (h) {
            unwrapToParagraph(h);
        } else {
            exec('formatBlock', tag.toLowerCase());
        }
    }

    // 切换引用
    function toggleBlock(tag) {
        const el = findAncestor(tag);
        if (el) {
            unwrapToParagraph(el);
        } else {
            exec('formatBlock', tag.toLowerCase());
        }
    }

    toolbar.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const cmd = btn.dataset.cmd;
        if (cmd && commands[cmd]) commands[cmd]();
    });

    // 回车不跳出 blockquote / pre
    editor.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const parent = getSelection().focusNode?.parentElement;
            if (parent?.tagName === 'PRE' || parent?.closest('pre')) {
                exec('insertHTML', '\n');
                e.preventDefault();
            }
        }
    });
})();

// ===== 工具函数 =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(msg, type) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `toast ${type} show`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== 初始化 =====
renderArticleList();

// ===== 评论管理 =====
const COMMENTS_KEY = 'sk_comments';

function getComments() {
    const data = localStorage.getItem(COMMENTS_KEY);
    return data ? JSON.parse(data) : [];
}

function saveComments(comments) {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
}

function renderCommentManagement() {
    const panel = document.getElementById('commentPanel');
    const comments = getComments();
    const articles = getArticles();

    if (comments.length === 0) {
        panel.innerHTML = '<p class="empty-tip">暂无评论</p>';
        return;
    }

    // 按文章分组
    const grouped = {};
    comments.forEach(c => {
        if (!grouped[c.articleId]) grouped[c.articleId] = [];
        grouped[c.articleId].push(c);
    });

    let html = '';
    for (const articleId in grouped) {
        const article = articles.find(a => a.id === articleId);
        const articleTitle = article ? escapeHtml(article.title) : '(文章已删除)';
        const group = grouped[articleId];

        html += `<div class="comment-group">`;
        html += `<h3 class="comment-group-title">${articleTitle}</h3>`;

        group.forEach(c => {
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
                    <button class="btn-danger btn-sm" onclick="deleteComment('${c.id}')">删除</button>
                </div>
            `;
        });

        html += `</div>`;
    }

    panel.innerHTML = html;
}

function deleteComment(id) {
    if (!confirm('确定要删除这条评论吗？')) return;
    let comments = getComments();
    comments = comments.filter(c => c.id !== id);
    saveComments(comments);
    renderCommentManagement();
    showToast('评论已删除', 'success');
}

// 初始化时渲染评论管理
renderCommentManagement();
