const tabs = document.querySelectorAll('[data-tab]');
const contents = document.querySelectorAll('.content');
let activeIndex = 0;

tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
        contents[activeIndex].classList.remove('visible');
        tabs[activeIndex].classList.remove('navActive');
        activeIndex = i;
        tab.classList.add('navActive');
        contents[i].classList.add('visible');
    });
});

const music = document.getElementById('music');
const playBtn = document.getElementById('playMusic');
music.loop = true;

playBtn.addEventListener('click', () => {
    if (music.paused) {
        music.play();
        playBtn.textContent = '暂停';
    } else {
        music.pause();
        playBtn.textContent = '播放';
    }
});

// ===== 移动端：工作区右侧导航 =====
(function initWorkMobile() {                              // 定义并立即执行
    const workItems = document.querySelectorAll('.work ul li'); // 获取所有工作区标题
    if (!workItems.length) return;                             // 没有标题则退出

    const workSection = document.querySelector('.work');       // 获取工作区容器

    function setupMobileWork() {                               // 设置移动端布局
        let displayArea = workSection.querySelector('.work-display'); // 查找已有展示区

        if (window.innerWidth <= 768) {                        // 屏幕宽度 ≤ 768px（手机/平板）
            if (!displayArea) {                                // 展示区不存在则创建
                displayArea = document.createElement('div');   // 创建 div 元素
                displayArea.className = 'work-display';        // 设置 class
                workSection.appendChild(displayArea);          // 追加到工作区
            }

            if (!workItems[0].classList.contains('work-active')) { // 首个标题未激活
                showWorkContent(workItems[0]);                 // 默认显示第一个
            }

            workItems.forEach(item => {                        // 遍历每个标题
                item.addEventListener('click', function onClick() { // 绑定点击事件
                    showWorkContent(this);                     // 点击后显示该标题内容
                });
            });
        } else {                                               // 桌面端（宽度 > 768px）
            if (displayArea) {                                 // 如果存在展示区
                displayArea.remove();                          // 移除它
            }
            workItems.forEach(item => {                        // 遍历每个标题
                item.classList.remove('work-active');          // 清除高亮状态
            });
        }
    }

    function showWorkContent(activeItem) {                     // 展示指定标题的内容
        workItems.forEach(item => item.classList.remove('work-active')); // 清除所有高亮
        activeItem.classList.add('work-active');               // 高亮当前标题

        const displayArea = workSection.querySelector('.work-display'); // 获取展示区
        if (!displayArea) return;                              // 没有展示区则退出

        displayArea.innerHTML = '';                            // 清空展示区

        const title = activeItem.childNodes[0].textContent.trim(); // 提取标题文字（如"Html"）
        const links = activeItem.querySelectorAll('a');         // 获取标题下的所有链接

        if (links.length === 0) {                              // 该分类没有链接（如 Godot）
            const emptyMsg = document.createElement('p');      // 创建提示段落
            emptyMsg.className = 'work-empty';                 // 设置 class
            emptyMsg.textContent = `${title} - 暂无内容`;      // 显示"XXX - 暂无内容"
            displayArea.appendChild(emptyMsg);                 // 追加到展示区
        } else {                                               // 有链接
            links.forEach(link => {                            // 遍历每个链接
                const clone = link.cloneNode(true);            // 克隆链接（保留所有属性）
                displayArea.appendChild(clone);                // 追加到展示区
            });
        }
    }

    setupMobileWork();                                         // 初始化执行
    window.addEventListener('resize', setupMobileWork);        // 窗口缩放时重新判断
})();

// ===== 学习区：文章展示 =====
(function initLearn() {
    const STORAGE_KEY = 'sk_articles';
    const grid = document.getElementById('articleGrid');
    const empty = document.getElementById('articleEmpty');
    const searchInput = document.getElementById('searchArticle');
    const modal = document.getElementById('articleModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMeta = document.getElementById('modalMeta');
    const modalBody = document.getElementById('modalBody');
    const modalClose = document.getElementById('modalClose');

    let allArticles = [];

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
        try {
            const data = localStorage.getItem(COMMENTS_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
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
        if (!nickname.trim() || !content.trim()) return null;
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

    // 从 localStorage 读取文章
    function loadArticles() {
        const data = localStorage.getItem(STORAGE_KEY);
        allArticles = data ? JSON.parse(data) : [];
        renderArticles(allArticles);
    }

    // 渲染文章卡片到网格
    function renderArticles(articles) {
        if (articles.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'block';
            return;
        }
        empty.style.display = 'none';

        grid.innerHTML = articles.map(article => `
            <div class="article-card" data-id="${article.id}">
                <div class="card-title">${escapeHtml(article.title)}</div>
                <div class="card-summary">${escapeHtml(article.summary)}</div>
                <div class="card-date">${article.date}</div>
            </div>
        `).join('');
    }

    // 搜索过滤（按标题和简介）
    function filterArticles(keyword) {
        if (!keyword.trim()) {
            renderArticles(allArticles);
            return;
        }
        const kw = keyword.trim().toLowerCase();
        const filtered = allArticles.filter(a =>
            a.title.toLowerCase().includes(kw) ||
            a.summary.toLowerCase().includes(kw)
        );
        renderArticles(filtered);
    }

    // 打开文章详情弹窗
    function openArticle(id) {
        const article = allArticles.find(a => a.id === id);
        if (!article) return;

        modalTitle.textContent = article.title;
        modalMeta.textContent = article.date;
        modalBody.innerHTML = article.content;
        // 渲染评论区
        renderComments(article.id);
        modalBody.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

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

    // 关闭弹窗
    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }

    // 转义 HTML 防 XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 点击卡片 → 打开详情
    grid.addEventListener('click', e => {
        const card = e.target.closest('.article-card');
        if (card) openArticle(card.dataset.id);
    });

    // 搜索
    searchInput.addEventListener('input', () => {
        filterArticles(searchInput.value);
    });

    // 关闭弹窗
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', e => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });

    // 首次加载
    loadArticles();

    // 每次切换到学习区时重新加载（后台可能发布了新文章）
    document.querySelector('[data-tab="learn"]').addEventListener('click', () => {
        setTimeout(loadArticles, 100);
    });
})();

