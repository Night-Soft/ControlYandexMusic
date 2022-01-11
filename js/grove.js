let groove = document.getElementsByClassName("groove-all")[0];
let grooveCurrent = document.getElementsByClassName("groove-current")[0];
let handle = document.getElementsByClassName("handle")[0];
let currentTime = document.querySelector(".current-time");
let durationSpan = document.querySelector(".duration");
let moveTimeCurrent = document.querySelector(".move-time-current");
let currentMoveTime = document.getElementById("CurrentMoveTime");

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
    return isPlay;
}

let mouseMove = (event) => {
    var x = event.clientX;
    x += -25;
    moveTimeCurrent.style.left = "calc(" + x + "px - " + "20px)";
    moveTimeCurrent.style.display = "flex";
    //console.log("set block " + moveTimeCurrent.offsetLeft);
    currentMoveTime.innerHTML = countTimeHelper();

}

groove.onmousemove = mouseMove;

groove.onmouseout = (event) => {
    moveTimeCurrent.style.display = "none";
    //console.log("set None");

}

groove.onmousedown = function(event) {
    var x = event.clientX;
    x += -25;
    grooveCurrent.style.width = x + "px";
    handle.style.left = "calc(" + x + "px - " + "10px)";
    countTime();
    groove.onmousemove = function(event) {
        var x = event.clientX;
        x += -25;
        grooveCurrent.style.width = x + "px";
        handle.style.left = "calc(" + x + "px - " + "10px)";
        countTime();
        if (grooveCurrent.offsetWidth >= groove.offsetWidth) {
            groove.onmousemove = null;
            grooveCurrent.style.width = groove.offsetWidth + "px";

        }
        if (x <= 0) {
            groove.onmousemove = null;
            handle.style.left = "calc(" + "0" + "px - " + "10px)";
            grooveCurrent.style.width = "0px";
        }
    }

}
groove.onmouseup = function() {
    groove.onmousemove = mouseMove;
    document.onmousemove = null;

}

let countProcent = (currentGrove) => {
    let grooveWidth = groove.offsetWidth;
    return Math.round(currentGrove * 100 / grooveWidth);
}

function setTime(currentSeconds) {
    sendTime("setTime", currentSeconds);
}

function setTrackProgress(duration = getDuration(), progress = getProgress(), isPlaying = getIsPlay()) {
    //set duration time progress
    if (!isPlaying) return;
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
    if (!isPlay) return;
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
    currentTime.innerHTML = time; // below image
    return time;
}

let countTimeHelper = (duration = getDuration(), currentPosition = moveTimeCurrent.offsetLeft + 20) => {
    let currentSeconds = countProcent(currentPosition) * duration / 100;
    let minutes = 0;
    let seconds = 0;
    if (currentSeconds > 60) {
        minutes = Math.floor(currentSeconds / 60);
        seconds = Math.round(currentSeconds - minutes * 60);
    } else {
        seconds = Math.round(currentSeconds);
    }
    let time = twoDigits(seconds, minutes);
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
        }

    });
}