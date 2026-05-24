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

