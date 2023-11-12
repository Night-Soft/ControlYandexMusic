let LongPressButton = class {
    #isStartPress;
    #timeoutId;
    #onclickFunc;

    constructor(button, func, delay = 750) {
        this.button = button;
        this.func = func;
        this.delay = Math.floor(Math.random() * delay);

        button.addEventListener("mousedown", this.#onmousedown.bind(this));
        button.addEventListener("mouseup", this.#onmouseup.bind(this));
    }

    #onmousedown(event) {
        if (event.button != 0) { return; }
        clearTimeout(this.#timeoutId);
        this.#isStartPress = true;
        this.#timeoutId = setTimeout(() => {
            this.#isStartPress = false;
            if (this.button.onclick != null) {
                this.#onclickFunc = this.button.onclick;
                this.button.onclick = null;
            }
            this.func();
        }, this.delay);
    }
    #onmouseup(event) {
        if (event.button != 0) { return; }
        if (this.#isStartPress) {
            clearTimeout(this.#timeoutId);
            this.#isStartPress = false;
            if (this.#onclickFunc != null) {
                this.button.onclick = this.#onclickFunc;
            }
        }
    }
}

let notificationTimer;
let showNotification = (text, timeMs) => {
    clearTimeout(notificationTimer);
    if (text != undefined) {
        textNotification.innerHTML = text;
    } else {
        textNotification.innerHTML = chrome.i18n.getMessage("addedToBlackList");
    }
    notification.style.display = "flex";
    let keyframe = {
        transform: ['translateY(-100%)', 'translateY(0%)'],
    };
    let options = {
        duration: 450,
        fill: "both"
    }
    notification.animate(keyframe, options);
    if (timeMs == undefined) {
        timeMs = text.length * 84 + options.duration * 2 + 100;
        if (timeMs <= options.duration * 2 + 500) { // + 500ms for focus 
            timeMs = options.duration * 2 + 500;
        }
    }
    notificationTimer = setTimeout(() => {
        notification.classList.remove("slide-bottom");

        let keyframe = {
            transform: ['translateY(0%)', 'translateY(-100%)'],
        };
        notification.animate(keyframe, options);
        notificationTimer;
    }, timeMs);
}

let getYandexMusicTab = () => {
    return new Promise(function(resolve, reject) {
        chrome.tabs.query({
            windowType: "normal"
        }, function(tabs) {
            for (let i = tabs.length - 1; i >= 0; i--) {
                if (tabs[i].url.startsWith("https://music.yandex")) {
                    resolve(tabs[i].id);
                    break;
                } else if (i == 0) {
                    resolve(false);
                }
            }
        });
    });
}

let sendEvent = (event, isResponse = false, forceObject = false) => {
    if (typeof(event) != "object") event = { data: event };
    if (forceObject) event = { data: event };
    port.postMessage(event);
}

let getUrl = (url, size = 50) => {
    if (url == undefined) {
        url = "img/icon.png"
        return url;
    } else {
        let endSlice = url.lastIndexOf("/") - url.length + 1;
        if (!url.startsWith("https://")) {
            url = "https://" + url
        }
        url = url.slice(0, endSlice); // -
        url += size + "x" + size;
        return url;
    }
}

let testImage = (url, size = 400, callback) => {
    try {
        modalCover[0].src = getUrl(url, size);
        modalCover[0].onerror = function () {
            if (size > 100) {
                if (size == 100) {
                    size += -50;
                    testImage(getUrl(url, size), size)
                }
                size += -100;
                testImage(getUrl(url, size), size);
            }
        };
        modalCover[0].onload = () => {
            modal[0].style.display = "flex";
            callback.animate(callback.parameter); // call animation
        }

    } catch (error) {
        console.log(error);
    }
}

let animateMainImage = (item) => {
    let width = item.offsetWidth;
    let height = item.offsetHeight;
    let left = -(window.innerWidth / 2 - width / 2 - item.offsetLeft);
    let top = -(window.innerHeight / 2 - height / 2 - item.offsetTop);

    let keyframe = {
        width: [width + 'px', 80 + '%'],
        height: [height + 'px', 96 + '%'],
        transform: ['translate(' + left + 'px, ' + top + 'px)', 'translate(0px, 0px)'],
        borderRadius: ['15px', '20px'],
        easing: ['cubic-bezier(.85, .2, 1, 1)']
    }
    let options = {
        duration: 500,
        // fill: 'both'
    }

    CurrentAnimation.keyframe = keyframe;
    CurrentAnimation.options = options;
    CurrentAnimation.isFromList = false;
    modalCover[0].animate(keyframe, options);
}

const CoverAnimation = {
    offset(el) {
        let rect = el.getBoundingClientRect(),
            scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
    },
    keyframe: {
        easing: ['cubic-bezier(.85, .2, 1, 1)'],
        width: undefined,
        height: undefined,
        transform: undefined,
        borderRadius: undefined
    },
    options: {
        duration: 500,
        direction: 'normal'
    },
    element: undefined
}
const openCoverAnimate = function(element, reverse = false) {
    const {options, keyframe, offset} = CoverAnimation;
    CoverAnimation.element = element;
    let width = element.offsetWidth;
    let height = element.offsetHeight;
    let elementOffset = offset(element);
    let left = -(window.innerWidth / 2 - width / 2 - elementOffset.left);
    let top = -(window.innerHeight / 2 - height / 2 - elementOffset.top);

    let style = getComputedStyle(element);
    const borderRadius = parseInt(style.borderRadius.slice(0, -2));
    keyframe.width = [width + 'px', 100 + '%'];
    keyframe.height = [height + 'px', 100 + '%'];
    keyframe.transform = ['translate(' + left + 'px, ' + top + 'px)', 'translate(0px, 0px)'];
    keyframe.borderRadius = [borderRadius + 'px', '0px'];

    if (reverse) {
        options.direction = 'reverse'
    } else {
        options.direction = 'normal';
    }

    modalCover[0].animate(keyframe, options);
}

let openCover = (item, url) => {
    testImage(url, 400, { animate: openCoverAnimate, parameter: item });
}

let toggleLike = (isLike) => {
    if (isLike) {
        like[0].style.backgroundImage = "url(img/like.png)";
    } else {
        like[0].style.backgroundImage = "url(img/no-like.png)";
    }
}
let toggleDislike = (isDisliked, notifyMe = false) => {
    if (isDisliked) {
        dislike.style.backgroundImage = "url(img/disliked.svg)";
        if (notifyMe) {
            showNotification(chrome.i18n.getMessage("addedToBlackList"));
        }
    } else {
        dislike.style.backgroundImage = "url(img/dislike.svg)";
        if (notifyMe) {
            showNotification(chrome.i18n.getMessage("removeFromBlackList"));
        }
    }
}

let openNewTab = (tabId) => {
    if (tabId != undefined) {
        chrome.tabs.reload(tabId);
        loaderContainer.style.display = "block";
        appDetected.innerHTML = chrome.i18n.getMessage("waitWhilePage");
        appQuestion.style.display = "none";
        yesNoNew.style.display = "none";
        return;
    }
    chrome.tabs.create({
        url: "https://music.yandex.ru/home",
        active: false
    });
    loaderContainer.style.display = "block";
    appDetected.innerHTML = chrome.i18n.getMessage("waitWhilePage");
    appQuestion.style.display = "none";
    yesNoNew.style.display = "none";
}


let showNoConnected = () => {
    getYandexMusicTab().then((result) => {
        if (Extension.isConnected == false) {
            if (result) {
                appDetected.innerHTML = chrome.i18n.getMessage("appDetected");
                appQuestion.innerHTML = chrome.i18n.getMessage("appQuestion");
                bntNo.style.display = "none";
                loaderContainer.style.display = "none";
                btnNew.style.display = "";
                yesNoNew.style.display = "flex";
                btnYes.innerHTML = chrome.i18n.getMessage("reload");
                noConnect.style.display = "flex";
                appQuestion.style.display = "";
                noConnect.classList.add("puff-in-center");
                reload = true;
            } else {
                appDetected.innerHTML = chrome.i18n.getMessage("appNoDetected");
                appQuestion.innerHTML = chrome.i18n.getMessage("appNoQuestion");
                loaderContainer.style.display = "none";
                btnNew.style.display = "none";
                bntNo.style.display = "none";
                btnYes.innerHTML = chrome.i18n.getMessage("yes");
                yesNoNew.style.display = "flex";
                noConnect.style.display = "flex";
                appQuestion.style.display = "";
                reload = false;
            }
        }
    });
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
        seconds = Math.round(currentSeconds);
    }
    return { hours: hours, minutes: minutes, seconds: seconds }
}

/** 
* @param {number} time - seconds, minutes, hours.
* Time units must be number.
*/
let twoDigits = function (...args) {
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
    if (formatedTime.length == 0) return "00:00"; 
    return formatedTime.reverse().join(":");
}

let getDurationAsString = (duration = 0) => {
    const {seconds, minutes, hours} = splitSeconds(duration);
    return twoDigits(seconds, minutes, hours);
}    