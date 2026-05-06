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

