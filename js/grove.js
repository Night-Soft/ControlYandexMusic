let groove = document.getElementsByClassName("groove-all")[0];
let grooveCurrent = document.getElementsByClassName("groove-current")[0];
let handle = document.getElementsByClassName("handle")[0];
let moveTime = document.getElementsByClassName("move-time")[0];
let timeProcent = document.getElementById("Time");
groove.onclick = function(event) {
    var x = event.clientX;
    x += -25;
    grooveCurrent.style.width = x + "px";
    handle.style.left = "calc(" + x + "px - " + "10px)";
    //var y = event.clientY;
    console.log("X coords: " + x);
    moveTime.style.display = "flex";
    timeProcent.innerHTML = countTime();

    groove.onmousedown = function(event) {
        console.log("groove width = " + groove.offsetWidth);
        console.log("grooveCurrent width = " + grooveCurrent.offsetWidth);
        //moveTime.style.display = "flex";
        //countProcent(grooveCurrent.offsetWidth);

        groove.onmousemove = function(event) {
            var x = event.clientX;
            x += -25;
            grooveCurrent.style.width = x + "px";
            handle.style.left = "calc(" + x + "px - " + "10px)";
            //console.log("X coords: " + x);
            timeProcent.innerHTML = countTime();
            //timeProcent.innerHTML = "324";

            console.log(timeProcent.textContent);

            if (grooveCurrent.offsetWidth >= groove.offsetWidth) {
                groove.onmousemove = null;
                grooveCurrent.style.width = groove.offsetWidth + "px";
                console.log("groove width = " + groove.offsetWidth);
                console.log("grooveCurrent width = " + grooveCurrent.offsetWidth);
            }
            if (x <= 0) {
                groove.onmousemove = null;
                handle.style.left = "calc(" + "0" + "px - " + "10px)";
                grooveCurrent.style.width = "0px";
                console.log("grooveCurrent width = " + grooveCurrent.offsetWidth);
            }
        }
        groove.onmouseup = function() {
            groove.onmousemove = null;
            document.onmousemove = null;
            moveTime.style.display = "none";


        }
        groove.onmouseleave = () => {
            groove.onmousemove = null;
            document.onmousemove = null;
            moveTime.style.display = "none";
        }

    }
}

let countProcent = (currentGrove) => {
    let grooveWidth = groove.offsetWidth;
    currentGrove = grooveCurrent.offsetWidth;
    return Math.round(currentGrove * 100 / grooveWidth);
    //return countTime();
}

let countTime = (allSeconds = 150) => {
    let currentSeconds = countProcent(grooveCurrent.offsetWidth) * allSeconds / 100;
    let minutes = 0;
    let seconds = 0;
    if (currentSeconds > 60) {
        minutes = Math.floor(currentSeconds / 60);
        seconds = Math.round(currentSeconds - minutes * 60);
    } else {
        seconds = Math.round(currentSeconds);
    }
    let time = "" + minutes + ":" + seconds;
    return time;
}