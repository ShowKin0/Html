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
        modalBody.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
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

