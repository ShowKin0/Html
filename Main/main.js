var btn = document.querySelectorAll('header button');
var act = 0;
for(let i = 0; i < btn.length; i++){
    btn[i].addEventListener('click', function() {
    btn[act].classList.remove('active');
    act = i;
    this.classList.add('active');
})
}

