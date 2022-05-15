let Slider = class {
    constructor(groove, currentGroove, handle, helper) {
        this.groove = groove;
        this.currentGroove = currentGroove;
        this.handle = handle;
        this.helper = helper;

        groove.onmousemove = this.onMouseMove.bind(this);
        groove.onmouseleave = this.onMouseLeave.bind(this);

        groove.onmousedown = this.onMouseDown.bind(this);
        groove.onmouseup = this.onMouseUp.bind(this);
        groove.onwheel = this.onWheel.bind(this);

        this.scale = 50;
        this.scaleOnMouseMove = 50;
        this.maxScale = 100;
        this.isHelper = true;
        this.isMouseEnter = false;
        this.isOwnDataHelper = false;
        groove.onmouseenter = (event) => {
            this.isMouseEnter = true;
            setTimeout(() => {
                if (this.isHelper) {
                    if (this.isMouseEnter == true) {
                        this.helper.style.display = "block";
                        this.setPositionHelper(event);
                    }
                }
            }, 150);
            this.ownMouseEnter(event);

        }
        this.setPosition({ event: { type: "wheel" }, scale: this.scale });
    }
    onWheel(event) {
        if (event.deltaY < 0) {
            if (this.scale <= this.maxScale) {
                this.scale += 4;
                if (this.scale > this.maxScale) this.scale = this.maxScale;
                this.setPosition({ event: event, scale: this.scale });
                this.setPositionHelper({ scale: this.scale });


            }
        } else {
            if (this.scale >= 0) {
                this.scale -= 4;
                if (this.scale < 0) this.scale = 0;
                this.setPosition({ event: event, scale: this.scale });
                this.setPositionHelper({ scale: this.scale });

            }
        }
        this.ownWheel(event);

    }
    ownWheel(event) {};
    ownMouseEnter(event) {};
    onMouseMove(event) {
        this.setPositionHelper(event);
        this.ownMouseMove(event);
    }
    ownMouseMove(event) {};
    onMouseLeave(event) {
        this.isMouseEnter = false;
        this.helper.style.display = "none";
        this.groove.onmouseleave = this.onMouseLeave.bind(this);
        this.groove.onmousemove = this.onMouseMove.bind(this);
        this.ownMouseLeave(event);
    }
    ownMouseLeave(event) {};
    onMouseDown(event) {
        this.setPosition(event);
        this.ownMouseDown(event);
        this.groove.onmousemove = (event) => {
            this.setPosition(event);
            this.setPositionHelper(event);
            this.ownMouseMoveDown(event);
        }
    }
    ownMouseMoveDown(event) {};
    ownMouseDown(event) {};
    onMouseUp(event) {
        this.groove.onmouseleave = this.onMouseLeave.bind(this);
        this.groove.onmousemove = this.onMouseMove.bind(this);
        this.ownMouseUp(event);
    }
    ownMouseUp(event) {};
    counter(x) {
        let countProcent = (currentGrove) => {
            return Math.round(currentGrove * this.maxScale / this.groove.offsetWidth);
        }
        return countProcent(x);
    }
    setPosition(event) {
        if (event.hasOwnProperty("scale")) {
            if (event.scale > this.maxScale) event.scale = this.maxScale;
            let x = event.scale * this.groove.offsetWidth / this.maxScale;
            this.currentGroove.style.width = x + "px";
            this.handle.style.left = x + this.groove.offsetLeft - this.handle.offsetWidth + this.handle.offsetWidth / 2 + "px";
            this.scale = event.scale;
            return;
        }
        if (event.hasOwnProperty("event")) { // from wheel and constructor
            let x = event.scale * this.groove.offsetWidth / this.maxScale;
            this.currentGroove.style.width = x + "px";
            this.handle.style.left = x + this.groove.offsetLeft - this.handle.offsetWidth + this.handle.offsetWidth / 2 + "px";
            return;
        }

        let x = event.x - this.groove.offsetLeft;
        if (x >= 0 && x <= this.groove.offsetWidth) {
            this.currentGroove.style.width = x + "px";
            this.handle.style.left = x + this.groove.offsetLeft - this.handle.offsetWidth + this.handle.offsetWidth / 2 + "px";
            this.scale = this.currentGroove.offsetWidth * this.maxScale / this.groove.offsetWidth;
        } else if (x > this.groove.offsetWidth) {
            x = this.groove.offsetWidth;
            this.currentGroove.style.width = x + "px";
            this.handle.style.left = x + this.groove.offsetLeft - this.handle.offsetWidth + this.handle.offsetWidth / 2 + "px";
            this.scale = this.currentGroove.offsetWidth * this.maxScale / this.groove.offsetWidth;
        } else if (x < 0) {
            x = 0;
            this.currentGroove.style.width = x + "px";
            this.handle.style.left = x + this.groove.offsetLeft - this.handle.offsetWidth + this.handle.offsetWidth / 2 + "px";
            this.scale = this.currentGroove.offsetWidth * this.maxScale / this.groove.offsetWidth;
        }
    }
    setPositionHelper(event) {
        if (event.hasOwnProperty("scale")) {
            if (this.isHelper) {
                let x = event.scale * this.groove.offsetWidth / this.maxScale;
                let percent = this.counter(x);
                this.scaleOnMouseMove = percent;
                if (this.isOwnDataHelper) return;
                if (percent <= this.maxScale && percent >= 0) { // percent
                    this.setDataHelper(percent);
                }
            }
            return;
        }
        if (this.isHelper) {
            let x = event.x - this.groove.offsetLeft;
            if (x >= 0 && x <= this.groove.offsetWidth) {
                this.helper.style.left = x + this.groove.offsetLeft - this.helper.offsetWidth + this.helper.offsetWidth / 2 + "px";
            }
            let percent = this.counter(x);
            this.scaleOnMouseMove = percent;
            if (this.isOwnDataHelper) return;
            if (percent <= this.maxScale && percent >= 0) { // percent
                this.setDataHelper(percent);
            }
        }
    }
    setDataHelper(data) {
        this.helper.innerHTML = data;
    }
    display(bool) {
        if (bool) {
            this.groove.style.display = "block";
            this.currentGroove.style.display = "block";
            this.handle.style.display = "block";
            this.helper.style.display = "block";
        } else {
            this.groove.style.display = "";
            this.currentGroove.style.display = "";
            this.handle.style.display = "";
            this.helper.style.display = "";
        }

    }
    showHelper(bool) {
        if (bool) {
            this.isHelper = true;
            this.helper.style.display = "block";
        } else {
            this.isHelper = false;
            this.helper.style.display = "none";
        }
    }
}

// toggles and volume

let sliderVolumeElemnt = document.getElementsByClassName("slider")[0];
let currentGrooveVol = document.getElementsByClassName("slider-groove-current")[0];
let handleVol = document.getElementsByClassName("slider-handle")[0];
let helperVol = document.getElementsByClassName("slider-helper")[0];

let sliderVolume = new Slider(sliderVolumeElemnt, currentGrooveVol, handleVol, helperVol);

sliderVolume.ownMouseMoveDown = () => {
    sendEvent({ setVolume: sliderVolume.scale / 100 });
    updateToggleVolumeIcon(sliderVolume.scale);
}
sliderVolume.ownMouseDown = () => {
    sendEvent({ setVolume: sliderVolume.scale / 100 });
    updateToggleVolumeIcon(sliderVolume.scale);
}
sliderVolume.ownWheel = () => {
    sendEvent({ setVolume: sliderVolume.scale / 100 });
    updateToggleVolumeIcon(sliderVolume.scale);
}

let toggleShuffle = document.querySelector(".toggle-shuffle");
let toggleRepeat = document.querySelector(".toggle-repeat");
let toggleVolume = document.getElementsByClassName("toggle-volume")[0];
let sliderVolumeContent = document.getElementsByClassName("slider-content")[0];
let contentGrooveVolume = document.getElementsByClassName("content-groove-volume")[0];

let whiteFilter = "invert(0%) sepia(72%) saturate(2%) hue-rotate(123deg) brightness(108%) contrast(100%)";
let mouseEnter = false;
let isVolAnim = false;

contentGrooveVolume.onmouseenter = (event) => {
    mouseEnter = true;
    endVolumeAnim();
    setTimeout(() => {
        if (mouseEnter == true) {
            sliderVolumeContent.style.display = "block";
            let keyframe = {
                width: ['0px', '60px'],
                opacity: [0.3, 1]
            };
            let options = {
                duration: 300,
            }
            sliderVolumeContent.animate(keyframe, options);
            isVolAnim = true;
        }
    }, 150);
}

let endVolumeAnim = (ev) => {
    sliderVolumeContent.removeEventListener("animationend", endVolumeAnim);
    sliderVolumeContent.classList.remove("hide-volume");
    sliderVolumeContent.style.display = "none";
    sliderVolumeContent.style.animation = null;
}

contentGrooveVolume.onmouseleave = () => {
    mouseEnter = false;
    if (isVolAnim == true) {
        sliderVolumeContent.addEventListener("animationend", endVolumeAnim);
        sliderVolumeContent.style.animation = "hide-volume 300ms";
        isVolAnim = false;
    }
}

let updateVolume = (volume) => {
    volume = volume * 100;
    sliderVolumeContent.style.display = "block"; // for slider can get offset
    if (volume >= 50) {
        sliderVolume.setPosition({ scale: volume });
        toggleVolume.style.backgroundPositionY = "-5px";

    } else if (volume < 50 && volume != 0) {
        sliderVolume.setPosition({ scale: volume });
        toggleVolume.style.backgroundPositionY = "-35px";

    }
    if (volume <= 0) {
        sliderVolume.setPosition({ scale: volume });
        toggleVolume.style.backgroundPositionY = "-65px";
    }
    sliderVolumeContent.style.display = "none";
}

let updateRepeat = (repeat) => {
    if (repeat == null) {
        toggleRepeat.style.display = "none";
        return;
    }
    if (repeat === true) {
        toggleRepeat.style.backgroundPositionY = "-6px";
        toggleRepeat.style.filter = whiteFilter;
        toggleRepeat.style.opacity = "1";
    } else {
        toggleRepeat.style.backgroundPositionY = "-6px";
        toggleRepeat.style.filter = "";
        toggleRepeat.style.opacity = "";
    }
    if (repeat === 1) {
        toggleRepeat.style.backgroundPositionY = "-36px";
        toggleRepeat.style.filter = whiteFilter;
        toggleRepeat.style.opacity = "1";
    }
}

let updateShuffle = (shuffle) => {
    if (shuffle == null) {
        toggleShuffle.style.display = "none";
        return;
    }
    if (shuffle === true) {
        toggleShuffle.style.filter = whiteFilter;
        toggleShuffle.style.opacity = "1";
    } else {
        toggleShuffle.style.filter = "";
        toggleShuffle.style.opacity = "";
    }
}

toggleShuffle.onclick = (event) => {
    sendEvent({ toggleShuffle: true });
}
toggleRepeat.onclick = (event) => {
    sendEvent({ toggleRepeat: true });

}
toggleVolume.onclick = (event) => {
    sendEvent({ toggleVolume: true });

}
toggleVolume.onwheel = (event) => {
    if (event.deltaY < 0) {
        if (sliderVolume.scale <= sliderVolume.maxScale) {
            sliderVolume.scale += 4;
            if (sliderVolume.scale > sliderVolume.maxScale) sliderVolume.scale = sliderVolume.maxScale;
            sliderVolume.setPosition({ event: event, scale: sliderVolume.scale });
            sliderVolume.setPositionHelper({ scale: sliderVolume.scale });
            sendEvent({ setVolume: sliderVolume.scale / 100 });
            updateToggleVolumeIcon(sliderVolume.scale);
        }
    } else {
        if (sliderVolume.scale >= 0) {
            sliderVolume.scale -= 4;
            if (sliderVolume.scale < 0) sliderVolume.scale = 0;
            sliderVolume.setPosition({ event: event, scale: sliderVolume.scale });
            sliderVolume.setPositionHelper({ scale: sliderVolume.scale });
            sendEvent({ setVolume: sliderVolume.scale / 100 });
            updateToggleVolumeIcon(sliderVolume.scale);


        }
    }
}

let updateToggleVolumeIcon = (scale) => {
    if (scale >= 50) {
        toggleVolume.style.backgroundPositionY = "-5px";
    } else if (scale < 50 && scale != 0) {
        toggleVolume.style.backgroundPositionY = "-35px";
    }
    if (scale <= 0) {
        toggleVolume.style.backgroundPositionY = "-65px";
    }
}

// slider progress and time of track

let sliderProgressElement = document.getElementsByClassName("slider")[1];
let progressGrooveCurrent = document.getElementsByClassName("slider-groove-current")[1];
let progressHandle = document.getElementsByClassName("slider-handle")[1];
let progressHelper = document.getElementsByClassName("slider-helper")[1];

let currentTime = document.querySelector(".current-time"); // below image
let durationSpan = document.querySelector(".duration"); // below image

let progressUpdater;
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

let sliderPrgress = new Slider(sliderProgressElement, progressGrooveCurrent, progressHandle, progressHelper);
sliderPrgress.isOwnDataHelper = true;

sliderPrgress.ownMouseMove = (event) => {
    sliderPrgress.setDataHelper(countTimeHelpers(event.x - 25, getDuration())); // -25 = helper.offsetLeft
}

sliderPrgress.ownMouseMoveDown = (event) => {
    sliderPrgress.setDataHelper(countTimeHelpers(event.x - 25, getDuration())); // -25 = helper.offsetLeft
    setTime();
}

sliderPrgress.ownMouseDown = (event) => {
    setTime();
}

sliderPrgress.ownWheel = (event) => {
    setTime();
}

let countTimeHelpers = (currentPosition, duration = getDuration()) => {
    let currentSeconds = currentPosition * 100 / sliderPrgress.groove.offsetWidth * duration / 100;
    let time = twoDigits(splitSeconds(currentSeconds).seconds, splitSeconds(currentSeconds).minutes);
    return time;
}

function setTime() {
    let currentSeconds = sliderPrgress.currentGroove.offsetWidth * 100 /
        sliderPrgress.groove.offsetWidth * duration / 100;
    getProgress(currentSeconds);
    trackUpdater();
    sendTime("setTime", currentSeconds);
}

function setTrackProgress(duration = getDuration(), progress = getProgress(), isPlaying = getIsPlay()) {
    //set duration time progress
    sliderPrgress.maxScale = duration;
    durationSpan.innerHTML = twoDigits(splitSeconds(duration).seconds, splitSeconds(duration).minutes);
    //set current time progress
    currentTime.innerHTML = twoDigits(splitSeconds(progress).seconds, splitSeconds(progress).minutes);
    // set progress to slider
    sliderPrgress.setPosition({ scale: progress });
}

function trackUpdater(duration = getDuration(), progress = getProgress(), isPlay = getIsPlay()) {
    try {
        clearInterval(progressUpdater)
    } catch (error) {
        console.log(error)
    }
    if (!isPlay) return;
    if (progress == 0) {
        sendEvent({ getProgress: true });
        return;
    }
    if (isPlay) progressUpdater = setInterval(updaterTimer, 500);
    sliderPrgress.maxScale = duration;

    function updaterTimer() {
        getProgress(progress); // set progress value
        if (progress >= duration) {
            clearInterval(progressUpdater);
            return;
        }
        //set current time progress
        currentTime.innerHTML = twoDigits(splitSeconds(progress).seconds, splitSeconds(progress).minutes);
        sliderPrgress.setPosition({ scale: progress });
        progress += 0.5;

    }
}

let splitSeconds = (currentSeconds) => {
    let minutes = 0;
    let seconds = 0;
    if (currentSeconds >= 59) {
        minutes = Math.floor(currentSeconds / 60);
        seconds = Math.floor(currentSeconds - minutes * 60);
    } else {
        seconds = Math.ceil(currentSeconds);
    }
    return { minutes: minutes, seconds: seconds }
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
        textMinutes = minutes;
    }
    return textMinutes + ":" + textSeconds;
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