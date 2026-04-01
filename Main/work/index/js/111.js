var Menu = document.querySelectorAll('.Menu');
var subMenuItems = document.querySelectorAll('.subMenu_1 li');
var titleSpans = document.querySelectorAll('.title h6 span');

// 点击一级菜单切换子菜单显示
Menu.forEach(function(item){
    item.addEventListener('click', function(e){
        // 阻止冒泡，避免点击子菜单时触发
        e.stopPropagation();
        this.classList.toggle('active');
    })
});

// 点击子菜单项更新title路径
subMenuItems.forEach(function(item){
    item.addEventListener('click', function(e){
        e.stopPropagation();
        // 获取父级菜单的文本（一级菜单）
        titleSpans[0].textContent = this.closest('.Menu').querySelector('span').textContent;
        // 获取当前点击的文本（二级菜单）
        titleSpans[1].textContent = this.textContent;
        
    })
});
