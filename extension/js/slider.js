let Slider = class {
    constructor(groove, currentGroove, handle, helper) {
        this.groove = groove;
        this.currentGroove = currentGroove;
        this.handle = handle;
        this.Helper = {
            element: helper,
            isShown: false,
            isHelper: true
        }

        groove.onmousemove = this.onMouseMove.bind(this);
        groove.onmouseleave = this.onMouseLeave.bind(this);

        groove.onmousedown = this.onMouseDown.bind(this);
        groove.onmouseup = this.onMouseUp.bind(this);
        groove.onwheel = this.onWheel.bind(this);

        this.scale = 50;
        this.scaleOnMouseMove = 50;
        this.maxScale = 100;
        this.isMouseEnter = false;
        this.isOwnDataHelper = false;
        groove.onmouseenter = (event) => {
            this.isMouseEnter = true;
            setTimeout(() => {
                if (this.Helper.isHelper) {
                    if (this.isMouseEnter == true) {
                        this.showHelper(true);
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
        this.showHelper(false);
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
    counter(currentGrove) {
        return Math.round(currentGrove * this.maxScale / this.groove.offsetWidth);
    }
    setPosition(event) {
        if (event.hasOwnProperty("scale")) {
            if (event.scale > this.maxScale) event.scale = this.maxScale;
            let x = event.scale * this.groove.offsetWidth / this.maxScale;
            this.currentGroove.style.width = x + "px";
            this.handle.style.left = x + this.groove.offsetLeft - this.handle.offsetWidth + this.handle.offsetWidth / 2 + "px";
            this.scale = event.scale;
            //console.log(x, this.currentGroove.style.width, this.handle.style.left);
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
            if (this.Helper.isHelper) {
                let x = event.scale * this.groove.offsetWidth / this.maxScale;
                if (x >= 0 && x <= this.groove.offsetWidth) {
                    this.Helper.element.style.left = x + this.groove.offsetLeft - this.Helper.element.offsetWidth + this.Helper.element.offsetWidth / 2 + "px";
                }
                let percent = this.counter(x);
                this.scaleOnMouseMove = percent;
                if (this.isOwnDataHelper) return;
                if (percent <= this.maxScale && percent >= 0) { // percent
                    this.setDataHelper(percent);
                }
            }
            return;
        }
        if (this.Helper.isHelper) {
            let x = event.x - this.groove.offsetLeft;
            if (x >= 0 && x <= this.groove.offsetWidth) {
                this.Helper.element.style.left = x + this.groove.offsetLeft - this.Helper.element.offsetWidth + this.Helper.element.offsetWidth / 2 + "px";
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
        this.Helper.element.innerHTML = data;
    }

    showHelper(bool) {
        if (bool == this.Helper.isShown) return;
        if (bool) {
            this.Helper.isShown = true;
            this.Helper.element.style.display = "block";
        } else {
            this.Helper.isShown = false;
            this.Helper.element.style.display = "none";
        }
    }
}

// toggles and volume

let sliderVolumeElement = document.getElementsByClassName("slider")[0];
let currentGrooveVol = document.getElementsByClassName("slider-groove-current")[0];
let handleVol = document.getElementsByClassName("slider-handle")[0];
let helperVol = document.getElementsByClassName("slider-helper")[0];

let sliderVolume = new Slider(sliderVolumeElement, currentGrooveVol, handleVol, helperVol);
sliderVolume.ownMouseMoveDown = () => {
    sendEvent({ setVolume: sliderVolume.scale / 100 }, false, true);
    updateToggleVolumeIcon(sliderVolume.scale);
}
sliderVolume.ownMouseDown = () => {
    sendEvent({ setVolume: sliderVolume.scale / 100 }, false, true);
    updateToggleVolumeIcon(sliderVolume.scale);
}
sliderVolume.ownWheel = () => {
    sendEvent({ setVolume: sliderVolume.scale / 100 }, false, true);
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
        sliderVolume.showHelper(false);
    }
}

/**
 * @param {number} volume min 0 max 1.
 */
let setVolume = (volume) => {
    volume = volume * 100;
    let isVolume;
    if (sliderVolumeContent.style.display != "block") {
        sliderVolumeContent.style.display = "block"; // for slider can get offset
        isVolume = false;
    }
    if (volume >= 50) {
        sliderVolume.setPosition({ scale: volume });
        updateToggleVolumeIcon(volume);
    } else if (volume < 50 && volume != 0) {
        sliderVolume.setPosition({ scale: volume });
        updateToggleVolumeIcon(volume);
    }
    if (volume <= 0) {
        sliderVolume.setPosition({ scale: volume });
        updateToggleVolumeIcon(volume);
    }
    if (isVolume == false) {
        sliderVolumeContent.style.display = "none";
    }
}

let updateRepeat = (repeat) => {
    if (repeat == null) {
        toggleRepeat.style.display = "none";
        return;
    }
    if (repeat === true) {
        toggleRepeat.style.backgroundImage = "url(img/repeat.svg)"
        toggleRepeat.style.filter = whiteFilter;
        toggleRepeat.style.opacity = "1";
    } else {
        toggleRepeat.style.backgroundImage = "url(img/repeat.svg)"
        toggleRepeat.style.filter = "";
        toggleRepeat.style.opacity = "";
    }
    if (repeat === 1) {
        toggleRepeat.style.backgroundImage = "url(img/repeat-one.svg)";
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
    sendEvent({ toggleShuffle: true }, false, true);
}
toggleRepeat.onclick = (event) => {
    sendEvent({ toggleRepeat: true }, false, true);

}
toggleVolume.onclick = (event) => {
    sendEvent({ toggleVolume: true }, false, true);

}
toggleVolume.onwheel = (event) => {
    sliderVolume.showHelper(true);
    if (event.deltaY < 0) {
        if (sliderVolume.scale <= sliderVolume.maxScale) {
            sliderVolume.scale += 4;
            if (sliderVolume.scale > sliderVolume.maxScale) sliderVolume.scale = sliderVolume.maxScale;
            sliderVolume.setPosition({ event: event, scale: sliderVolume.scale });
            sliderVolume.setPositionHelper({ scale: sliderVolume.scale });
            sendEvent({ setVolume: sliderVolume.scale / 100 }, false, true);
            updateToggleVolumeIcon(sliderVolume.scale);
        }
    } else {
        if (sliderVolume.scale >= 0) {
            sliderVolume.scale -= 4;
            if (sliderVolume.scale < 0) sliderVolume.scale = 0;
            sliderVolume.setPosition({ event: event, scale: sliderVolume.scale });
            sliderVolume.setPositionHelper({ scale: sliderVolume.scale });
            sendEvent({ setVolume: sliderVolume.scale / 100 }, false, true);
            updateToggleVolumeIcon(sliderVolume.scale);
        }
    }
}

let updateToggleVolumeIcon = (scale) => {
    if (scale >= 50) {
        toggleVolume.style.backgroundImage = "url(img/volume-max.svg)";
    } else if (scale < 50 && scale != 0) {
        toggleVolume.style.backgroundImage = "url(img/volume-middle.svg)";
    }
    if (scale <= 0) {
        toggleVolume.style.backgroundImage = "url(img/volume-mute.svg)";
    }
}

// slider progress and time of track

let sliderProgressElement = document.getElementsByClassName("slider")[1];
let progressGrooveCurrent = document.getElementsByClassName("slider-groove-current")[1];
let progressHandle = document.getElementsByClassName("slider-handle")[1];
let progressHelper = document.getElementsByClassName("slider-helper")[1];

let currentTime = document.querySelector(".current-time"); // below image
let durationSpan = document.querySelector(".duration"); // below image

let progressUpdater, currentUnixTime;
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
    sliderPrgress.setDataHelper(countTimeHelpers(event.x - sliderPrgress.groove.offsetLeft, getDuration())); // -25 = helper.offsetLeft
}

sliderPrgress.ownMouseMoveDown = (event) => {
    sliderPrgress.setDataHelper(countTimeHelpers(event.x - sliderPrgress.groove.offsetLeft, getDuration())); // -25 = helper.offsetLeft
    setTime();
}

sliderPrgress.ownMouseDown = (event) => {
    setTime();
}

sliderPrgress.ownWheel = (event) => {
    setTime();
    sliderPrgress.setDataHelper(countTimeHelpers(sliderPrgress.currentGroove.offsetWidth, getDuration())); // -25 = helper.offsetLeft

}

let countTimeHelpers = (currentPosition, duration = getDuration()) => {
    let currentSeconds = currentPosition * 100 / sliderPrgress.groove.offsetWidth * duration / 100;
    let time = getStringDuration(currentSeconds);
    return time;
}

function setTime() {
    let currentSeconds = sliderPrgress.currentGroove.offsetWidth * 100 /
        sliderPrgress.groove.offsetWidth * duration / 100;
    getProgress(currentSeconds);
    trackUpdater();
    sendEvent({
        data: "setTime",
        time: currentSeconds,
    });
}

function setTrackProgress(duration = getDuration(), progress = getProgress(), isPlaying = getIsPlay()) {
    //set duration time progress
    sliderPrgress.maxScale = duration;
    durationSpan.innerHTML = getStringDuration(duration);
    //set current time progress
    currentTime.innerHTML = getStringDuration(progress);
    // set progress to slider
    sliderPrgress.setPosition({ scale: progress });
}

const stopUpdater = () => {
    try {
        clearInterval(progressUpdater)
    } catch (error) { console.log(error); }
}
let getProgressCouter = 0;
let getProgressId;
function trackUpdater(duration = getDuration(), progress = getProgress(), isPlay = getIsPlay()) {
    stopUpdater();
    if (!isPlay) return;
    if (progress == 0) {
        if (getProgressCouter <= 150) { // 150 request in 30 seconds
            clearInterval(getProgressId);
            getProgressId = setTimeout(() => {
                sendEvent({ getProgress: true }, false, true);
                getProgressCouter++;
            }, 200);
        } else {
            changeState(false);
            getProgressCouter = 0;
        }
        return;
    }    
    getProgressCouter = 0;
    changeState(isPlay);
    if (isPlay) progressUpdater = setInterval(updaterTimer, 500);
    sliderPrgress.maxScale = duration;
    currentUnixTime = Date.now();
    progress = Number.parseFloat(progress.toFixed(6));
    function updaterTimer() {
        if (progress >= duration) {
            clearInterval(progressUpdater);
            changeState(false);
            return;
        }
        if (Date.now() - currentUnixTime >= 500) {
            progress += (Date.now() - currentUnixTime) / 1000;
            currentUnixTime = Date.now();
        }
        //set current time progress
        if (progress > duration) { progress = duration; }
        progress = Number.parseFloat(progress.toFixed(6));
        currentTime.innerHTML = getStringDuration(progress);
        sliderPrgress.setPosition({ scale: progress });
    }
}

let splitSeconds = (currentSeconds) => {
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    if (currentSeconds / 3600 > 0) {
        hours = Math.floor(currentSeconds / 3600);
        currentSeconds = currentSeconds - (hours * 3600);
    }
    if (currentSeconds > 59) {
        minutes = Math.floor(currentSeconds / 60);
        seconds = Math.floor(currentSeconds - minutes * 60);
    } else {
        seconds = Math.ceil(currentSeconds);
    }
    return { hours: hours, minutes: minutes, seconds: seconds }
}

let twoDigits = (seconds, minutes, hours) => {
    let textSeconds, textMinutes, textHours;
    if(hours > 0 && hours < 10) {
        textHours = "0" + hours;
    } else {
        textHours = hours;
    }
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
    if (hours > 0) {
    return textHours + ":" + textMinutes + ":" + textSeconds;
    }
    return textMinutes + ":" + textSeconds;
}

let getStringDuration = (duration = 0) => {
    const {seconds, minutes, hours} = splitSeconds(duration);
    return twoDigits(seconds, minutes, hours);
}

try {
    JsOnload.onload("Slider", false);
} catch (error) {
    //console.log(error);
}
    