var Menu = document.querySelectorAll('.Menu');
var subMenuItems_1 = document.querySelectorAll('.subMenu_1 li');
var subMenuItems_2 = document.querySelectorAll('.subMenu_2 li');
var subMenuItems_3 = document.querySelectorAll('.subMenu_3 li');
var titleSpans = document.querySelectorAll('.title h6 span');

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
        titleSpans[1].textContent = this.textContent;
        
    })
});
subMenuItems_2.forEach(function(item){
    item.addEventListener('click', function(e){
        e.stopPropagation();
        titleSpans[1].textContent = this.textContent;
        
    })
});
subMenuItems_3.forEach(function(item){
    item.addEventListener('click', function(e){
        e.stopPropagation();
        titleSpans[1].textContent = this.textContent;
        
    })
});

