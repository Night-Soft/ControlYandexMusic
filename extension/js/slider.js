let Slider = class {
    onmousemovedown(event) { }
    onmousedown(event) { }
    onmouseup(event) { }
    onmousemove(event) { }
    onmouseenter(event) { }
    onmouseleave(event) {}
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
        this.isOwnDataToltip = false;
        this.toggleTransiton(false);
        this.setDelayTooltip(false);
        this.setPosition(this.scale);
        this.toggleTransiton(true);

        groove.addEventListener("mousemove", this.#mousemove.bind(this));
        groove.addEventListener("mouseleave", this.#mouseleave.bind(this));
        groove.addEventListener("mousedown", this.#mousedown.bind(this));
        groove.addEventListener("mouseup", this.#mouseup.bind(this));
        groove.addEventListener("wheel", this.#wheel.bind(this));

        groove.addEventListener("mouseenter", this.#delayTootip);


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
        event.preventDefault();
        event.stopImmediatePropagation();
        if (event.toElement == null) { return; }
        this.isMouseEnter = false;
        this.showTooltip(false);
        this.groove.removeEventListener("mousemove", this.#mousemoveDown);
        this.toggleTransiton(true);
        this.onmouseleave(event);
    }
    #mousedown(event) {
        event.preventDefault();
        if (event.button != 0) { return; }
        this.setPosition(event);
        this.groove.addEventListener("mousemove", this.#mousemoveDown);
        this.toggleTransiton(false);
        this.onmousedown(event);

    }
    #mousemoveDown = (event) => {
        this.setPosition(event);
        this.setTooltipPosition(event);
        this.onmousemovedown(event);
    }
    #mouseup(event) {
        this.toggleTransiton(true);
        this.groove.removeEventListener("mousemove", this.#mousemoveDown);
        this.onmouseup(event);

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
        this.onmouseenter(event);
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
                if (this.isOwnDataToltip) return;
                if (x <= this.maxScale && x >= 0) { // percent
                    this.setTooltipData(Math.floor(x));
                }
            }
            return;
        }
        if (this.Tooltip.isTooltip) {
        
            let x = (event.x - this.groove.offsetLeft) * 100 / this.groove.offsetWidth;
            this.Tooltip.element.style.left = `calc(${x}% - ${this.Tooltip.element.offsetWidth}px / 2)`;
            if (this.isOwnDataToltip) return;
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
            this.Tooltip.element.style.display = "flex";
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
let tooltipVol = document.getElementsByClassName("slider-toltip")[0];
let sliderVolumeContent = document.getElementsByClassName("slider-content")[0];

let sliderVolume = new Slider(sliderVolumeElement, currentGrooveVol, handleVol, tooltipVol);

const sendVolumeDelay = new ExecutionDelay(() => {
    sendEvent({ setVolume: sliderVolume.scale / 100 }, false, true);
}, {
    delay: 200,
    isThrottling: true
});

sliderVolume.onmousemovedown = () => { sendVolumeDelay.start(); }

sliderVolume.onmousedown = (event) => {
    sliderVolume.setTooltipPosition(event);
    sendEvent({ setVolume: sliderVolume.scale / 100 }, false, true);
}
sliderVolume.onwheel = () => {
    sendEvent({ setVolume: sliderVolume.scale / 100 }, false, true);
}

// slider progress and time of track

let sliderProgressElement = document.getElementsByClassName("slider")[1];
let progressGrooveCurrent = document.getElementsByClassName("slider-groove-current")[1];
let progressHandle = document.getElementsByClassName("slider-handle")[1];
let progressToltip = document.getElementsByClassName("slider-toltip")[1];

let currentTime = document.querySelector(".current-time"); // below image
let durationSpan = document.querySelector(".duration"); // below image

let progressUpdater, currentUnixTime;

let sliderProgress = new Slider(sliderProgressElement, progressGrooveCurrent, progressHandle, progressToltip);
sliderProgress.isOwnDataToltip = true;
sliderProgress.setDelayTooltip(150);

const sendPositionDelay = new ExecutionDelay((event) => {
    sliderProgress.setTooltipData(getDurationAsString(getSeconds(event.x - sliderProgress.groove.offsetLeft)));
    setTime(getSeconds(event.x - sliderProgress.groove.offsetLeft));
}, {
    delay: 200,
    isThrottling: true
});

let seconds;
sliderProgress.onmousemove = (event) => {
    seconds = getSeconds(event.x - sliderProgress.groove.offsetLeft);
    if (seconds > State.duration) {
        seconds = State.duration;
    } else if (seconds < 0) {
        seconds = 0;
    }
    sliderProgress.setTooltipData(getDurationAsString(seconds));
}

sliderProgress.onmousemovedown = (event) => {
    sendPositionDelay.start(event);
}

sliderProgress.onmousedown = (event) => {
    setTime(getSeconds(event.x - sliderProgress.groove.offsetLeft));
}

sliderProgress.onwheel = (event) => {
    let seconds = event.deltaY < 0 ? 4 : -4;
    sliderProgress.setTooltipData(getDurationAsString(State.position + seconds));
    setTime(State.position + seconds);
}

const getSeconds = function (currentPosition, duration = State.duration) {
    return parseFloat((currentPosition / sliderProgress.groove.offsetWidth * duration).toFixed(6));
}

function setTime(seconds) {
    State.position = seconds;
    sendEvent({
        data: "setTime",
        time: seconds,
    });
}

const loadingWaitingBar = document.getElementsByClassName('loading-waiting-bar')[0];
const toggleLoadingWaitingBarDelay = new ExecutionDelay({ delay: 1000 });
toggleLoadingWaitingBarDelay.setFunction(function (show = true) {
    if (show) {
        const percent = 100 - State.position * 100 / State.duration;
        loadingWaitingBar.style.width = percent + '%';
        loadingWaitingBar.style.display = 'block';
        this.isShown = true;
    } else {
        loadingWaitingBar.style.display = '';
        this.isShown = false;
    }
}).setContext(toggleLoadingWaitingBarDelay);

Object.defineProperties(toggleLoadingWaitingBarDelay, {
    '#isShown': {
        value: false,
        writable: true
    },
    isShown: {
        enumerable: true,
        get() { return this['#isShown']; },
        set(value) {
            if (typeof value === "boolean") {
                this['#isShown'] = value;
            } else {
                this['#isShown'] = false;
            }
        }
    }
});