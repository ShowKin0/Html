var btn = document.querySelectorAll('header button');
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

