window.onload=function(){
    var pic=document.getElementsByClassName("pic");
    var index=0;
    var len=pic.length;
    var left=document.getElementById("left");
    var right=document.getElementById("right");
    var slide=true;
    left.onclick=function(){
        if(index>0){
            point[index].classList.remove("active");
            pic[index].classList.remove("active");
            index--;
            point[index].classList.add("active");
            pic[index].classList.add("active");
        }else{
            point[index].classList.remove("active");
            pic[index].classList.remove("active");
            index=len-1;
            point[index].classList.add("active");
            pic[index].classList.add("active");
        }
    }

    right.onclick=function(){
        if(index<len-1){
            point[index].classList.remove("active");
            pic[index].classList.remove("active");
            index++;
            point[index].classList.add("active");
            pic[index].classList.add("active");
        }else{
            point[index].classList.remove("active");
            pic[index].classList.remove("active");
            index=0;
            point[index].classList.add("active");
            pic[index].classList.add("active");
        }
    }
    var timer=null;
    
    right.onmouseover=function(){
        clearInterval(timer);
    }
    left.onmouseover=function(){
        clearInterval(timer);
    }
    right.onmouseout=function(){
        timer = setInterval(autoPlay,5000);
    }
    left.onmouseout=function(){
        timer = setInterval(autoPlay,5000);
    }
    var autoPlay=function(){
        if(index<len-1){
            point[index].classList.remove("active");
            pic[index].classList.remove("active");
            index++;
            point[index].classList.add("active");
            pic[index].classList.add("active");
        }else{
            point[index].classList.remove("active");
            pic[index].classList.remove("active");
            index=0;
            point[index].classList.add("active");
            pic[index].classList.add("active");
        }
    }
    timer = setInterval(autoPlay, 5000);
    var point=document.getElementsByClassName("point");
    for(let i=0;i<point.length;i++){
        point[i].addEventListener("click",function(e){
            point[index].classList.remove("active");
            pic[index].classList.remove("active");
            index=i;
            pic[index].classList.add("active");
            point[index].classList.add("active");
        });

    }

}