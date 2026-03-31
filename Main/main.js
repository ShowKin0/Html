var btn = document.querySelectorAll('nav button');
var content = document.querySelectorAll('.content');
var act = 0;
for(let i = 0; i < btn.length; i++){
    btn[i].addEventListener('click', function() {
    content[act].classList.remove('visible');
    btn[act].classList.remove('active');
    act = i;
    this.classList.add('active');
    content[i].classList.add('visible');
})
}
function playMusic(){
    var music = document.getElementById('music');
    var play = document.getElementById('playMusic');
    if(music.paused){
        music.play();
        play.innerHTML = '暂停';
    }else{
        music.pause();
        play.innerHTML = '播放';
    }
}

