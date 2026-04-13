var Menu = document.querySelectorAll('.Menu');
var btn = document.querySelectorAll('#btn');
var content = document.querySelectorAll('.content');
var subMenuItems_1 = document.querySelectorAll('.subMenu_1 li');
var subMenuItems_2 = document.querySelectorAll('.subMenu_2 li');
var subMenuItems_3 = document.querySelectorAll('.subMenu_3 li');
var titleSpans = document.querySelectorAll('.title h6 span');

var act = 0;
for(let i = 0; i < btn.length; i++){
    btn[i].addEventListener('click', function() {
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

// 点击子菜单项更新title路径
subMenuItems_1.forEach(function(item){
    item.addEventListener('click', function(e){
        e.stopPropagation();
        this.classList.add('active');
        titleSpans[0].textContent = this.parentElement.parentElement.querySelector('span').textContent;
        titleSpans[1].textContent = this.textContent;
    })
});
subMenuItems_2.forEach(function(item){
    item.addEventListener('click', function(e){
        e.stopPropagation();
        titleSpans[0].textContent = this.parentElement.parentElement.querySelector('span').textContent;
        titleSpans[1].textContent = this.textContent;
        
    })
});
subMenuItems_3.forEach(function(item){
    item.addEventListener('click', function(e){
        e.stopPropagation();
        titleSpans[0].textContent = this.parentElement.parentElement.querySelector('span').textContent;
        titleSpans[1].textContent = this.textContent;
        
    })
});

