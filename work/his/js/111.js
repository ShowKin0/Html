var Menu = document.querySelectorAll('.Menu');
var titleSpans = document.querySelectorAll('.title h6 span');
// 点击导航切换内容显示
var nav = document.querySelectorAll('#nav');
var content = document.querySelectorAll('.content');
var act = 0;
for(let i = 0; i < nav.length; i++){
    nav[i].addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.add('active');
        titleSpans[0].textContent = this.parentElement.parentElement.querySelector('span').textContent;
        titleSpans[1].textContent = this.textContent;
        content[act].classList.remove('visible');
        act = i;
        content[i].classList.add('visible');
})
}
// 点击一级菜单切换子菜单显示
Menu.forEach(function(item){
    item.addEventListener('click', function(e){
        this.classList.toggle('active');
        titleSpans[0].textContent = this.querySelector('span').textContent;
        titleSpans[1].textContent = '';

    })
});


