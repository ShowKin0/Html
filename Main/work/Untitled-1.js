
// 获取元素
        const title = document.getElementById("title");
        const button = document.getElementById("changeBtn");

        // 添加点击事件
        button.addEventListener("click", function() {
            var newTitle = prompt("请输入新的标题：");
            title.textContent = newTitle;
            title.style.color = "blue";
        });
  