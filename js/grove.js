let groove = document.getElementsByClassName("groove-all")[0];
let grooveCurrent = document.getElementsByClassName("groove-current")[0];
let handle = document.getElementsByClassName("handle")[0];
let moveTime = document.getElementsByClassName("move-time")[0];
let timeProcent = document.getElementById("Time");
let currentTime = document.querySelector(".current-time");
let durationSpan = document.querySelector(".duration");

var updater;
let duration = 0;
let progress = 0;
let isPlay = false;

let getDuration = (d) => {
    if (d != undefined) { duration = d; }
    return duration;
}
let getProgress = (p) => {
    if (p != undefined) { progress = p; }
    return progress;
}
let getIsPlay = (isP) => {
    if (isP != undefined) { isPlay = isP; }
    //console.log("isp " + isP)
    return isPlay;
}

groove.onmousedown = function(event) {
    var x = event.clientX;
    x += -25;
    grooveCurrent.style.width = x + "px";
    handle.style.left = "calc(" + x + "px - " + "10px)";
    //var y = event.clientY;
    //console.log("X coords: " + x);
    moveTime.style.display = "flex";
    timeProcent.innerHTML = countTime();
    // console.log("groove width = " + groove.offsetWidth);
    // console.log("grooveCurrent width = " + grooveCurrent.offsetWidth);
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

        //console.log(timeProcent.textContent);

        if (grooveCurrent.offsetWidth >= groove.offsetWidth) {
            groove.onmousemove = null;
            grooveCurrent.style.width = groove.offsetWidth + "px";
            // console.log("groove width = " + groove.offsetWidth);
            // console.log("grooveCurrent width = " + grooveCurrent.offsetWidth);
        }
        if (x <= 0) {
            groove.onmousemove = null;
            handle.style.left = "calc(" + "0" + "px - " + "10px)";
            grooveCurrent.style.width = "0px";
            //  console.log("grooveCurrent width = " + grooveCurrent.offsetWidth);
        }
    }

    // groove.onmouseleave = () => {
    //     groove.onmousemove = null;
    //     document.onmousemove = null;
    //     setTimeout(() => {
    //         moveTime.style.display = "none";                
    //     }, 1000);
    // }

}
groove.onmouseup = function() {
    groove.onmousemove = null;
    document.onmousemove = null;
    setTimeout(() => {
        moveTime.style.display = "none";
    }, 1500);

}

let countProcent = (currentGrove) => {
    let grooveWidth = groove.offsetWidth;
    currentGrove = grooveCurrent.offsetWidth;
    return Math.round(currentGrove * 100 / grooveWidth);
    //return countTime();
}

function setTime(currentSeconds) {
    sendTime("setTime", currentSeconds);
}

function setTrackProgress(duration = getDuration(), progress = getProgress(), isPlaying = getIsPlay()) {
    //set duration time progress
    let minutes = 0;
    let seconds = 0;
    if (duration > 60) {
        minutes = Math.floor(duration / 60);
        seconds = Math.round(duration - minutes * 60);
    } else {
        seconds = Math.round(duration);
    }
    durationSpan.innerHTML = twoDigits(seconds, minutes);

    //set current time progress
    minutes = 0;
    seconds = 0;
    if (progress > 60) {
        minutes = Math.floor(progress / 60);
        seconds = Math.round(progress - minutes * 60);
    } else {
        seconds = Math.round(progress);
    }
    time = twoDigits(seconds, minutes);
    currentTime.innerHTML = time

    // set progress to grove
    let grooveWidth = groove.offsetWidth;
    let widthCurrentGrove = Math.round((progress * 100 / duration) * grooveWidth / 100);
    let x = widthCurrentGrove;
    //console.log("x " + x)
    grooveCurrent.style.width = x + "px";
    handle.style.left = "calc(" + x + "px - " + "10px)";
}
let twoDigits = (seconds, minutes) => {
    let textSeconds, textMinutes;
    if (seconds < 10) {
        textSeconds = "0" + seconds;
    } else {
        textSeconds = seconds;
    }
    if (minutes < 10) {
        textMinutes = "0" + minutes;
    } else {
        textMinutes = sumMinutes;
    }
    return textMinutes + ":" + textSeconds;
}

function trackUpdater(duration = getDuration(), progress = getProgress(), isPlay = getIsPlay()) {
    try {
        clearInterval(updater)
    } catch (error) {
        console.log(error)
    }
    let minutes = 0;
    let seconds = 0;
    if (isPlay) updater = setInterval(updaterTime, 1000);

    function updaterTime() {
        progress += 1;
        getProgress(progress);
        if (progress >= duration) {
            clearInterval(updater);
            return;
        }
        //set current time progress
        minutes = 0;
        seconds = 0;
        if (progress >= 60) {
            minutes = Math.floor(progress / 60);
            seconds = Math.floor(progress - minutes * 60);
        } else {
            seconds = Math.floor(progress);
        }
        currentTime.innerHTML = twoDigits(seconds, minutes);


        // set progress to grove
        let grooveWidth = groove.offsetWidth;
        let widthCurrentGrove = Math.round((progress * 100 / duration) * grooveWidth / 100);
        let x = widthCurrentGrove;
        grooveCurrent.style.width = x + "px";
        handle.style.left = "calc(" + x + "px - " + "10px)";
    }

}

let countTime = (duration = getDuration()) => {
    let currentSeconds = countProcent(grooveCurrent.offsetWidth) * duration / 100;
    setTime(Math.floor(currentSeconds));
    getProgress(currentSeconds);
    trackUpdater();
    let minutes = 0;
    let seconds = 0;
    if (currentSeconds > 60) {
        minutes = Math.floor(currentSeconds / 60);
        seconds = Math.round(currentSeconds - minutes * 60);
    } else {
        seconds = Math.round(currentSeconds);
    }
    time = twoDigits(seconds, minutes);
    currentTime.innerHTML = time
    return time;
}

function sendTime(event, currentSeconds) {
    let activeTab;
    chrome.tabs.query({
        windowType: "normal"
    }, function(tabs) {
        for (let i = tabs.length - 1; i >= 0; i--) {
            if (tabs[i].url.startsWith("https://music.yandex")) {
                activeTab = tabs[i].id;
                break;
            }
        }
        if (activeTab != undefined) {
            chrome.tabs.sendMessage(activeTab, {
                data: event,
                time: currentSeconds,
            });
            //  console.log("must send time " +currentSeconds)

        }

    });
}