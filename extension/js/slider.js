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
        this.scale = 50;
        this.maxScale = 100;
        this.scaleOnMouseMove = 50;
        this.isMouseEnter = false;
        this.isOwnDataHelper = false;

        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseLeave = this._onMouseLeave.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onWheel = this._onWheel.bind(this);

        groove.addEventListener("mousemove", this._onMouseMove);
        groove.addEventListener("mouseleave", this._onMouseLeave);
        groove.addEventListener("mousedown", this._onMouseDown);
        groove.addEventListener("mouseup", this._onMouseUp);
        groove.addEventListener("wheel", this._onWheel);

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
        this.setPosition(this.scale);
    }
    _onWheel(event) {
        if (event.deltaY < 0) {
            if (this.scale <= this.maxScale) {
                this.scale += 4;
                if (this.scale > this.maxScale) this.scale = this.maxScale;
                this.setPosition(this.scale);
                this.setPositionHelper(this.scale);
            }
        } else {
            if (this.scale >= 0) {
                this.scale -= 4;
                if (this.scale < 0) this.scale = 0;
                this.setPosition(this.scale);
                this.setPositionHelper(this.scale);
            }
        }
        this.ownWheel(event);

    }
    ownWheel(event) { };
    ownMouseEnter(event) { };
    _onMouseMove(event) {
        this.setPositionHelper(event);
        this.ownMouseMove(event);
    }
    ownMouseMove(event) { };
    _onMouseLeave(event) {
        this.isMouseEnter = false;
        this.showHelper(false);
        this.groove.removeEventListener("mousemove", this.#onMouseMoveDown);
        this.ownMouseLeave(event);
    }
    ownMouseLeave(event) { };
    _onMouseDown(event) {
        this.setPosition(event);
        this.ownMouseDown(event);
        this.groove.addEventListener("mousemove", this.#onMouseMoveDown);
    }
    #onMouseMoveDown = (event) => {
        this.setPosition(event);
        this.setPositionHelper(event);
        this.ownMouseMoveDown(event);
    }
    ownMouseMoveDown(event) { };
    ownMouseDown(event) { };
    _onMouseUp(event) {
        this.groove.removeEventListener("mousemove", this.#onMouseMoveDown);
        this.ownMouseUp(event);
    }
    ownMouseUp(event) { };
    #counter(currentGrove) {
        return Math.round(currentGrove * this.maxScale / this.groove.offsetWidth);
    }
    setPosition(event) {
        if (isFinite(event)) { // from wheel and constructor
            if (event > this.maxScale) event = this.maxScale;
            let x = event * this.groove.offsetWidth / this.maxScale;
            this.currentGroove.style.width = x + "px";
            this.handle.style.left = x - this.handle.offsetWidth / 2 +"px";
            this.scale = event;
            return;
        }
        let x = event.x - this.groove.offsetLeft;
        if (x >= 0 && x <= this.groove.offsetWidth) {
            this.currentGroove.style.width = x + "px";
            this.handle.style.left = x - this.handle.offsetWidth / 2 +"px";
            this.scale = this.currentGroove.offsetWidth * this.maxScale / this.groove.offsetWidth;
        } else if (x > this.groove.offsetWidth) {
            x = this.groove.offsetWidth;
            this.currentGroove.style.width = x + "px";
            this.handle.style.left = x - this.handle.offsetWidth / 2 +"px";
            this.scale = this.currentGroove.offsetWidth * this.maxScale / this.groove.offsetWidth;
        } else if (x < 0) {
            x = 0;
            this.currentGroove.style.width = x + "px";
            this.handle.style.left = x - this.handle.offsetWidth / 2 +"px";
            this.scale = this.currentGroove.offsetWidth * this.maxScale / this.groove.offsetWidth;
        }
    }
    setPositionHelper(event) {
        if (isFinite(event)) {
            if (this.Helper.isHelper) {
                let x = event * this.groove.offsetWidth / this.maxScale;
                if (x >= 0 && x <= this.groove.offsetWidth) {
                    this.Helper.element.style.left = x - this.Helper.element.offsetWidth/2 + "px";
                }
                let percent = this.#counter(x);
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
                this.Helper.element.style.left = x - this.Helper.element.offsetWidth/2 + "px";
            }
            let percent = this.#counter(x);
            this.scaleOnMouseMove = percent;
            if (this.isOwnDataHelper) return;
            if (percent <= this.maxScale && percent >= 0) { // percent
                this.setDataHelper(percent);
            }
        }
    }

    setDataHelper(data,) {
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
    State.volume = volume;
    volume = volume * 100;
    let isVolume;
    if (sliderVolumeContent.style.display != "block") {
        sliderVolumeContent.style.display = "block"; // for slider can get offset
        isVolume = false;
    }
    if (volume >= 50) {
        sliderVolume.setPosition(volume);
        updateToggleVolumeIcon(volume);
    } else if (volume < 50 && volume != 0) {
        sliderVolume.setPosition(volume);
        updateToggleVolumeIcon(volume);
    }
    if (volume <= 0) {
        sliderVolume.setPosition(volume);
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
            sliderVolume.setPosition(sliderVolume.scale);
            sliderVolume.setPositionHelper(sliderVolume.scale);
            sendEvent({ setVolume: sliderVolume.scale / 100 }, false, true);
            updateToggleVolumeIcon(sliderVolume.scale);
        }
    } else {
        if (sliderVolume.scale >= 0) {
            sliderVolume.scale -= 4;
            if (sliderVolume.scale < 0) sliderVolume.scale = 0;
            sliderVolume.setPosition(sliderVolume.scale);
            sliderVolume.setPositionHelper(sliderVolume.scale);
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

let sliderPrgress = new Slider(sliderProgressElement, progressGrooveCurrent, progressHandle, progressHelper);
sliderPrgress.isOwnDataHelper = true;

sliderPrgress.ownMouseMove = (event) => {
    sliderPrgress.setDataHelper(countTimeHelpers(event.x - sliderPrgress.groove.offsetLeft, State.duration)); // -25 = helper.offsetLeft
}

sliderPrgress.ownMouseMoveDown = (event) => {
    sliderPrgress.setDataHelper(countTimeHelpers(event.x - sliderPrgress.groove.offsetLeft, State.duration)); // -25 = helper.offsetLeft
    setTime();
}

sliderPrgress.ownMouseDown = (event) => {
    setTime();
}

sliderPrgress.ownWheel = (event) => {
    setTime();
    sliderPrgress.setDataHelper(countTimeHelpers(sliderPrgress.currentGroove.offsetWidth, State.duration)); // -25 = helper.offsetLeft

}

let countTimeHelpers = (currentPosition, duration = State.duration) => {
    let currentSeconds = currentPosition * 100 / sliderPrgress.groove.offsetWidth * duration / 100;
    if (currentSeconds < 0) {
        currentSeconds = 0;
    } else if (currentSeconds > duration) {
        currentSeconds = duration;
    }
    let time = getStringDuration(currentSeconds);
    return time;
}

function setTime() {
    let currentSeconds = sliderPrgress.currentGroove.offsetWidth * 100 /
        sliderPrgress.groove.offsetWidth * State.duration / 100;
    State.progress = currentSeconds;
    trackUpdater();
    sendEvent({
        data: "setTime",
        time: currentSeconds,
    });
}

function setTrackProgress(duration = State.duration, progress = State.progress, isPlaying = State.isPlay) {
    //set duration time progress
    sliderPrgress.maxScale = duration;
    durationSpan.innerHTML = getStringDuration(duration);
    //set current time progress
    currentTime.innerHTML = getStringDuration(progress);
    // set progress to slider
    sliderPrgress.setPosition(progress);
}

const stopUpdater = () => {
    try {
        clearInterval(progressUpdater)
    } catch (error) { console.log(error); }
}
let getProgressCouter = 0;
let getProgressId;
function trackUpdater(duration = State.duration, progress = State.progress, isPlay = State.isPlay) {
    stopUpdater();
    if (!isPlay) return;
    if (progress == 0) {
        if (getProgressCouter <= 170) { // 150 request in 30 seconds
            clearInterval(getProgressId);
            getProgressId = setTimeout(() => {
                sendEvent({ getProgress: true }, false, true);
                getProgressCouter++;
            }, 200);
        } else {
            sendEvent("togglePause"); // set to pause
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
        sliderPrgress.setPosition(progress);
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
    JsOnload.onload("Slider", false); // side-panel.js
} catch (error) {
    //console.log(error);
}
    