let Slider = class {
    onmousemovedown(event) { }
    onmousedown(event) { }
    onmousemove(event) { }
    onwheel(event) { }
    constructor(groove, currentGroove, handle, tooltip) {
        this.groove = groove;
        this.currentGroove = currentGroove;
        this.handle = handle;
        this.Tooltip = {
            element: tooltip,
            isShown: false,
            isTooltip: true,
            delay: false
        }
        this.scale = 50;
        this.maxScale = 100;
        this.isMouseEnter = false;
        this.isOwnDataHelper = false;

        this.setDelayTooltip(false);
        this.setPosition(this.scale);

        groove.addEventListener("mousemove", this.#mousemove.bind(this));
        groove.addEventListener("mouseleave", this.#mouseleave.bind(this));
        groove.addEventListener("mousedown", this.#mousedown.bind(this));
        groove.addEventListener("mouseup", this.#mouseup.bind(this));
        groove.addEventListener("wheel", this.#wheel.bind(this));

        this.groove.addEventListener("mouseenter", this.#delayTootip);


    }
    #wheel(event) {
        if (event.deltaY < 0) {
            if (this.scale <= this.maxScale) {
                this.scale += 4;
                if (this.scale > this.maxScale) this.scale = this.maxScale;
                this.setPosition(this.scale);
                this.setTooltipPosition(this.scale);
            }
        } else {
            if (this.scale >= 0) {
                this.scale -= 4;
                if (this.scale < 0) this.scale = 0;
                this.setPosition(this.scale);
                this.setTooltipPosition(this.scale);
            }
        }
        this.onwheel(event);

    }
    #mousemove(event) {
        event.preventDefault();
        this.setTooltipPosition(event);
        this.onmousemove(event);
    }
    #mouseleave(event) {
        this.isMouseEnter = false;
        this.showTooltip(false);
        this.groove.removeEventListener("mousemove", this.#mousemoveDown);
        this.toggleTransiton(true);
    }
    #mousedown(event) {
        event.preventDefault();
        if (event.button != 0) { return; }
        this.setPosition(event);
        this.onmousedown(event);
        this.groove.addEventListener("mousemove", this.#mousemoveDown);
        this.toggleTransiton(false);

    }
    #mousemoveDown = (event) => {
        this.setPosition(event);
        this.setTooltipPosition(event);
        this.onmousemovedown(event);
    }
    #mouseup(event) {
        this.toggleTransiton(true);
        this.groove.removeEventListener("mousemove", this.#mousemoveDown);

     }
     #delayTootip = (event) => {
        if (this.Tooltip.delay > 0) { 
            this.isMouseEnter = true;
            setTimeout(() => {
                if (this.Tooltip.isTooltip) {
                    if (this.isMouseEnter == true) {
                        this.showTooltip(true);
                        this.setTooltipPosition(event);
                    }
                }
            }, this.Tooltip.delay);
        } else if (this.Tooltip.delay == false) {
            if (this.Tooltip.isTooltip) {
                this.showTooltip(true);
                this.setTooltipPosition(event);
            }
        }
    };
    toggleTransiton(enable = false) {
        if (enable) {
            this.groove.style.transition = '';
            this.currentGroove.style.transition = '';
            this.handle.style.transition = '';
        } else {
            this.groove.style.transition = 'none';
            this.currentGroove.style.transition = 'none';
            this.handle.style.transition = 'none';
        }
    }
    setPosition(event) {
        if (isFinite(event)) { // from wheel and constructor
            if (event > this.maxScale) event = this.maxScale;
            let x = event * 100 / this.maxScale;
            this.currentGroove.style.width = x + "%";
            this.handle.style.left = `calc(${x}% - ${this.handle.offsetWidth}px / 2)`;
            this.scale = event;
            return;
        }

        let x = event.x - this.groove.offsetLeft;
        if (x >= 0 && x <= this.groove.offsetWidth) {
            // nothing to do with x
        } else if (x > this.groove.offsetWidth) {
            x = this.groove.offsetWidth;
        } else if (x < 0) { x = 0; }

        x = x * 100 / this.groove.offsetWidth;
        this.currentGroove.style.width = x + "%";
        this.handle.style.left = `calc(${x}% - ${this.handle.offsetWidth}px / 2)`;
        this.scale = (x * this.groove.offsetWidth / 100) * 100 / this.groove.offsetWidth;
    }
    setTooltipPosition(event) {
        if (isFinite(event)) {
            if (this.Tooltip.isTooltip) {
                let x = event * 100 / this.maxScale;
                this.Tooltip.element.style.left = `calc(${x}% - ${this.Tooltip.element.offsetWidth}px / 2)`;
                if (this.isOwnDataHelper) return;
                if (x <= this.maxScale && x >= 0) { // percent
                    this.setTooltipData(Math.floor(x));
                }
            }
            return;
        }
        if (this.Tooltip.isTooltip) {
            let x = (event.x - this.groove.offsetLeft) * 100 / this.groove.offsetWidth;
            this.Tooltip.element.style.left = `calc(${x}% - ${this.Tooltip.element.offsetWidth}px / 2)`;
            if (this.isOwnDataHelper) return;
            if (x <= this.maxScale && x >= 0) { // percent
                this.setTooltipData(Math.floor(x));
            }
        }
    }

    setTooltipData(data) {
        this.Tooltip.element.innerHTML = data;
    }

    showTooltip(bool) {
        if (bool == this.Tooltip.isShown) return;
        if (bool) {
            this.Tooltip.isShown = true;
            this.Tooltip.element.style.display = "block";
        } else {
            this.Tooltip.isShown = false;
            this.Tooltip.element.style.display = "none";
        }
    }
    setDelayTooltip(delay = 150) {
        if (typeof delay == 'number') {
            this.Tooltip.delay = delay;
        } else if (delay === false) {
            this.Tooltip.delay = false;
        } else {
            throw new Error("Incorrect delay.");
        }

    }
}

// toggles and volume

let sliderVolumeElement = document.getElementsByClassName("slider")[0];
let currentGrooveVol = document.getElementsByClassName("slider-groove-current")[0];
let handleVol = document.getElementsByClassName("slider-handle")[0];
let tooltipVol = document.getElementsByClassName("slider-helper")[0];

let sliderVolume = new Slider(sliderVolumeElement, currentGrooveVol, handleVol, tooltipVol);
sliderVolume.onmousemovedown = () => {
    sendEvent({ setVolume: sliderVolume.scale / 100 }, false, true);
    updateToggleVolumeIcon(sliderVolume.scale);
}
sliderVolume.onmousedown = () => {
    sendEvent({ setVolume: sliderVolume.scale / 100 }, false, true);
    updateToggleVolumeIcon(sliderVolume.scale);
}
sliderVolume.onwheel = () => {
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
    sliderVolume.toggleTransiton(false);
    setTimeout(() => {
        if (mouseEnter == true) {
            sliderVolumeContent.style.display = "block";
            let keyframe = {
                // width: ['0px', '60px'],
                opacity: [0.3, 1]
            };
            let options = {
                duration: 300,
            }
            sliderVolumeContent.animate(keyframe, options).onfinish = () => {
                sliderVolume.toggleTransiton(true);
            };
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
        sliderVolume.showTooltip(false);
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
    sliderVolume.showTooltip(true);
    if (event.deltaY < 0) {
        if (sliderVolume.scale <= sliderVolume.maxScale) {
            sliderVolume.scale += 4;
            if (sliderVolume.scale > sliderVolume.maxScale) sliderVolume.scale = sliderVolume.maxScale;
            sliderVolume.setPosition(sliderVolume.scale);
            sliderVolume.setTooltipPosition(sliderVolume.scale);
            sendEvent({ setVolume: sliderVolume.scale / 100 }, false, true);
            updateToggleVolumeIcon(sliderVolume.scale);
        }
    } else {
        if (sliderVolume.scale >= 0) {
            sliderVolume.scale -= 4;
            if (sliderVolume.scale < 0) sliderVolume.scale = 0;
            sliderVolume.setPosition(sliderVolume.scale);
            sliderVolume.setTooltipPosition(sliderVolume.scale);
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
sliderPrgress.setDelayTooltip(150);

sliderPrgress.onmousemove = (event) => {
    sliderPrgress.setTooltipData(getDurationAsString(getSeconds(event.x - sliderPrgress.groove.offsetLeft)));
}

sliderPrgress.onmousemovedown = (event) => {
    sliderPrgress.setTooltipData(getDurationAsString(getSeconds(event.x - sliderPrgress.groove.offsetLeft)));
    setTime(getSeconds(event.x - sliderPrgress.groove.offsetLeft));
}

sliderPrgress.onmousedown = (event) => {
    setTime(getSeconds(event.x - sliderPrgress.groove.offsetLeft));
}

sliderPrgress.onwheel = (event) => {
    let seconds;
    if (event.deltaY < 0) {
        seconds = getSeconds(sliderPrgress.currentGroove.offsetWidth) + 4;
        setTime(seconds); // to do
    } else {
        seconds = getSeconds(sliderPrgress.currentGroove.offsetWidth) - 4;
        setTime(seconds); // to do
    }
    sliderPrgress.setTooltipData(getDurationAsString(seconds));
}

const getSeconds = function (currentPosition, duration = State.duration) {
    let currentSeconds = currentPosition * 100 / sliderPrgress.groove.offsetWidth * duration / 100;
    return currentSeconds;
}

function setTime(seconds) {
    State.position = seconds
    trackUpdater();
    sendEvent({
        data: "setTime",
        time: seconds,
    });
}

function setTrackProgress(duration = State.duration, progress = State.position, isPlaying = State.isPlay) {
    //set duration time progress
    sliderPrgress.maxScale = duration;
    durationSpan.innerHTML = getDurationAsString(duration);
    //set current time progress
    currentTime.innerHTML = getDurationAsString(progress);
    // set progress to slider
    updateProgress();
}

const awaitLoadingTrack = document.getElementsByClassName('loader-await-loading')[0];
let awaitLoadingId;
const showAwaitLoading = function (show = true, percent) {
    clearTimeout(awaitLoadingId)
    if (show) {
        awaitLoadingId = setTimeout(() => {
            awaitLoadingTrack.style.width = (100 - percent) + '%';
            awaitLoadingTrack.style.display = 'block';
        }, 1500);
    } else {
        awaitLoadingTrack.style.display = '';
    }
}

const updateProgress = function() {
    sliderPrgress.setPosition(State.position);
    const x = State.loaded * 100 / sliderPrgress.maxScale;
    loadedLine.style.width = x + "%";
}
const stopUpdater = () => {
    try {
        showAwaitLoading(false);
        clearInterval(progressUpdater);
    } catch (error) { console.log(error); }
}


let getProgressCouter = 0;
let getProgressId;
function trackUpdater(duration = State.duration, progress = State.position, isPlay = State.isPlay) {
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
        if (progress + 1 > State.loaded && progress > 1) {
            stopUpdater();
            const percent = progress * 100 / duration;
            showAwaitLoading(true, percent);
            return;
        }
        progress = Number.parseFloat(progress.toFixed(6));
        currentTime.innerHTML = getDurationAsString(progress);
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

let twoDigits = function (seconds, minutes, hours) {
    const formatedTime = [];
    for (let i = 0; i < arguments.length; i++) {
        let time = arguments[i];
        if (time > 0 && time < 10) {
            formatedTime.push("0" + time);
        } else if (i == 0 && time == 0) {
            formatedTime.push("00");
        }
        else if (time > 0) {
            formatedTime.push(time);
        }
    }
    if (formatedTime.length == 1) { formatedTime.push("00") }
    return formatedTime.reverse().join(":");
}

let getDurationAsString = (duration = 0) => {
    const {seconds, minutes, hours} = splitSeconds(duration);
    return twoDigits(seconds, minutes, hours);
}

try {
    JsOnload.onload("Slider", false); // side-panel.js
} catch (error) {
    //console.log(error);
}
    