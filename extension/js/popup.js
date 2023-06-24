//START EXTENSION
let previous = document.getElementsByClassName("previous");
let pause = document.getElementsByClassName("pause");
let next = document.getElementsByClassName("next");
let modal = document.getElementsByClassName("modal");
let trackImage = document.getElementsByClassName("cover");
let modalCover = document.getElementsByClassName("modal-cover");
let like = document.getElementsByClassName("like");
let trackName = document.getElementsByClassName("name-track");
let artistsName = document.getElementsByClassName("name-artists");
let btnYes = document.getElementById("Yes");
let bntNo = document.getElementById("No");
let btnNew = document.getElementById("New");
let appDetected = document.getElementById("AppDetected");
let appQuestion = document.getElementById("AppQuestion");
let noConnect = document.getElementsByClassName("no-connect")[0];
let loaderContainer = document.getElementsByClassName("loader-container")[0];
let yesNoNew = document.getElementsByClassName("yes-no-new")[0];


let transition = document.getElementsByClassName("transition");
let hamburgerMenuList = document.getElementsByClassName("hamburger-menu-list")[0];
let dislike = document.getElementsByClassName("dislike")[0];
let notification = document.getElementsByClassName("notification")[0];
let textNotification = document.getElementsByClassName("h2-notification")[0];
let notificationTrackName = document.getElementsByClassName("notification-track-name")[0];

let contentListMenu = document.getElementsByClassName("content-list-menu")[0];
let modalListMenu = document.getElementsByClassName("modal-list-menu")[0];

let port = {
    isConnected: false
};
let fromPopup = true;
let reload = false;
let urlCover;

let Extension = {
    onload: function() {
        this.createConnection().then((result) => {
            if (result) {
                sendEvent("extensionIsLoad");
            }
        });
    },
    createConnection: async() => {
        return new Promise((resolve, reject) => {
            getYandexMusicTab().then((result) => {
                if (result) {
                    try {
                        if (port.isConnected == false) {
                            port = chrome.tabs.connect(result, { name: chrome.runtime.id });
                            port.isConnected = true;
                        }
                    } catch (error) {
                        port.isConnected = false;
                    }
                    if (port.isConnected == false) {
                        showNoConnected();
                        resolve(false);
                        return;
                    }
                    onMessageAddListener();
                    resolve(true);
                } else {
                    Extension.isConnected = false;
                    showNoConnected();
                    resolve(false);
                }
            });
        });
    },
    currentWindow () {
        if (window.location.pathname == '/side-panel.html') {
            return { name: "side-panel" };
        } else {
            return { name: "popup" };
        }
    },
    isConnected: undefined
};

chrome.runtime.onMessage.addListener( // background, content script
    (request, sender, sendResponse) => {
        if (request.onload) {
            reload = false;
            if (port.isConnected == false) {
                Extension.createConnection();
            }
            if (noConnect.style.display == "flex") {
                noConnect.classList.add("puff-out-center");
                let endConnectAnim = () => {
                    noConnect.style.display = "none";
                    noConnect.classList.remove("puff-out-center");
                    noConnect.classList.remove("puff-in-center");
                    noConnect.removeEventListener("animationend", endConnectAnim);
                }
                noConnect.addEventListener("animationend", endConnectAnim);
            }
            getYandexMusicTab().then((id) => {
                chrome.tabs.update(id, {
                    active: true,
                    highlighted: true
                });
            });
        }
        if (request.options) {
            setOptions(request.options);
        }
        if (request.getFrame) {
            popupWindow.x = screenLeft;
            popupWindow.y = screenTop;
            window.moveTo(0,0);
            setTimeout(()=>{
                sendEventBackground({ frame: { height: screenTop, width: screenLeft } });
                window.moveTo(popupWindow.x - screenLeft, popupWindow.y - screenTop);
            }, 100);
        }
    });

chrome.runtime.onMessageExternal.addListener( // injected script
    (request, sender, sendResponse) => {
        switch (request.event) {
            case 'currentTrack': // get from the key
                setMediaData(request.currentTrack.title, getArtists(request.currentTrack, 5), request.currentTrack.cover);
                changeState(request.isPlaying);
                toggleLike(request.currentTrack.liked);
                toggleDislike(request.currentTrack.disliked);
                State.duration = request.currentTrack.duration;
                State.progress = request.progress.position;
                State.isPlay = request.isPlaying;
                setTrackProgress();
                trackUpdater();
                break;
            case 'togglePause':
                changeState(request.isPlaying);
                State.isPlay = request.isPlaying;
                trackUpdater(State.duration, State.progress, State.isPlay);
                break;
            case 'toggleLike':
                if (request.isLiked) {
                    toggleDislike(false);
                    toggleListDisliked(false);
                }
                toggleLike(request.isLiked);
                toggleListLike(request.isLiked);
                break;
            case 'toggleDislike':
                State.disliked = request.disliked.disliked;
                if (State.disliked) {
                    toggleLike(false);
                }
                toggleDislike(request.disliked.disliked, true);
                toggleListDisliked(request.disliked.disliked);
                break;
            case "STATE":
                changeState(request.isPlaying);
                State.progress = request.progress.position;
                State.isPlay = request.isPlaying;
                trackUpdater(State.duration, State.progress, State.isPlay);
                break;
            case "VOLUME":
                setVolume(request.volume);
                break;
            default:
                break;
        }

        if (request.trackInfo) {
            updateTracksList(request.trackInfo);
            State.track = request.trackInfo.tracksList[request.trackInfo.index];
            State.disliked = request.trackInfo.tracksList[request.trackInfo.index].disliked;
            State.likeItem = document.querySelectorAll(".item-track")[request.trackInfo.index].lastChild;
        }
        if (request.hasOwnProperty('controls')) {
            updateRepeat(request.controls.repeat);
            updateShuffle(request.controls.shuffle);
        }
        if (request.hasOwnProperty('volume')) {
            setVolume(request.volume);
        }
        if (request.hasOwnProperty('repeat')) {
            updateRepeat(request.repeat);
        }
        if (request.hasOwnProperty('shuffle')) {
            updateShuffle(request.shuffle);
        }
        if (request.hasOwnProperty('progress')) {
            if (Object.keys(request).length == 1) {
                State.progress = request.progress.position;
                trackUpdater();
            }
        }
        if (request.pagehide) {
            if (reload == true) return;
            sendEventBackground({ isConnected: false })
            window.close();
        }
        return false;
    });

let boundsChangedId;
chrome.windows.onBoundsChanged.addListener((ev) => {
    if (Extension.currentWindow().name == "side-panel") return;
    clearTimeout(boundsChangedId);
    boundsChangedId = setTimeout(() => {
        if (popupWindow.windowId == ev.id) {
            ev.isTrackListOpen = popupWindow.isPlaylistOpen;
            if (popupWindow.isPlaylistOpen == true) {
                ev.height = popupWindow.height;
                popupWindow.playlistHeight = window.innerHeight;
                ev.playlistHeight = popupWindow.playlistHeight - popupWindow.frameHeight;
            } else {
                ev.height = window.innerHeight;
                popupWindow.height = window.innerHeight;
                ev.playlistHeight = popupWindow.playlistHeight - popupWindow.frameHeight;
            }
            sendEventBackground({ savePopupBounds: ev });
        }
    }, 200);
}
);

let LongPressButton = class {
    constructor(button, func, delay = 750) {
        this.button = button;
        this.delay = delay;
        this.longpresStart = true;
        this.longpressTimer;
        this.func = func;
        this.onclickFunc;

        button.onmousedown = (event) => {
            if (event.button == 2) { return; }
            this.longpresStart = true;
            this.longpressTimer = setTimeout(() => {
                this.longpresStart = false;
                if (button.onclick != null) {
                    this.onclickFunc = button.onclick;
                    this.button.onclick = null;
                }
                this.func();
            }, this.delay);
        };

        button.onmouseup = (event) => {
            if (event.button == 2) { return; }
            if (this.longpresStart) {
                clearTimeout(this.longpressTimer);
                this.longpresStart = false;
                if (this.onclickFunc != null) {
                    this.button.onclick = this.onclickFunc;
                }
            }
        };
    }
}

btnYes.onclick = () => {
    //sendEventBackground({ keyOpenPage: false });
    if (reload == false) {
        openNewTab();
    } else {
        chrome.tabs.query({
            windowType: "normal"
        }, (tabs) => {
            for (let i = tabs.length - 1; i >= 0; i--) {
                if (tabs[i].url.startsWith("https://music.yandex")) {
                    openNewTab(tabs[i].id);
                    break;
                }
            }
        });
    }
}

bntNo.onclick = () => {
    noConnect.classList.add("puff-out-center");
    noConnect.addEventListener("animationend", () => {
        noConnect.style.display = "none";

    });
}

btnNew.onclick = () => {
    openNewTab();
}

previous[0].onclick = () => {
    sendEvent("previous");
    stopUpdater();
};

pause[0].onclick = () => {
    sendEvent("togglePause");
};

next[0].onclick = () => {
    sendEvent("next");
    stopUpdater();
};
like[0].onLongPress = new LongPressButton(like[0], () => {
    sendEvent("toggleDislike");
});

like[0].onclick = () => {
    sendEvent("toggleLike");
}

dislike.onLongPress = new LongPressButton(dislike, () => {
    sendEvent("toggleDislike");
});

dislike.onclick = () => {
    sendEvent("toggleDislike");
}
trackImage[0].onclick = () => {
    let removeClass = () => {
        modal[0].classList.remove("modal-background");
        modalCover[0].removeEventListener("animationend", removeClass);
    }
    modalCover[0].addEventListener("animationend", removeClass);
    modal[0].classList.add("modal-background");
    openCover(trackImage[0], urlCover);
};

modal[0].onclick = function() {
    let removeClass = () => {
        modal[0].classList.remove("modal-background-reverse");
        modal[0].removeEventListener("animationend", removeClass);
        modal[0].style.display = "none";
    }
    modal[0].addEventListener("animationend", removeClass);
    modal[0].classList.add("modal-background-reverse");
    let options = {
        duration: 500,
        direction: 'reverse',
    }
    if (CurrentAnimation.isFromList) {
        let offset = (el) => {
            let rect = el.getBoundingClientRect(),
                scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
                scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            return {
                top: rect.top + scrollTop,
                left: rect.left + scrollLeft
            }
        }
        let itemOffset = offset(State.coverItem);
        let left = -(window.innerWidth / 2 - State.coverItem.offsetWidth / 2 - itemOffset.left);
        let top = -(window.innerHeight / 2 - State.coverItem.offsetHeight / 2 - itemOffset.top);
        CurrentAnimation.keyframe.transform = ['translate(' + parseInt(left) + 'px, ' +
            parseInt(top) + 'px)', 'translate(0px, 0px)'
        ];
    }
    modalCover[0].animate(CurrentAnimation.keyframe, options);
}
let list = document.getElementById("listTrack");

if (typeof hamburgerMenuList != "undefined") {
    hamburgerMenuList.onclick = () => { togglePlaylist(); }  
} else {
//    togglePlaylist();
}

let PopupWindow = class {
    constructor() {
        if (!PopupWindow.instance) {
            PopupWindow.instance = this;
        } else {
            return PopupWindow.instance
        }

        let windows = chrome.windows.getAll({ populate: true, windowTypes: ['popup'] });
        windows.then((result) => {
            if (result.length) {
                let windowUrl;
                for (let i = 0; i < result.length; i++) {
                    windowUrl = result[i].tabs[0].url;
                    if (windowUrl.includes(chrome.runtime.id + "/popup.html")) {
                        this.windowId = result[i].tabs[0].windowId;
                    }
                }
            } else {
                this.windowId = undefined;
            }
        }, (reject) => {});

        this.x = 0;
        this.y = 0;
        this.windowId;
        this.correctMinSize();
    }
    
    #width = 250;
    #height = 110;
    #playlistHeight = 270;
    #isPlaylistOpen = false;
    correctMinSize() {
        if (window.innerHeight < 110) {
            window.resizeTo(this.width, this.height);
        }
    }
    resizeTo(width, height) {
        if (width == window.innerWidth && height == window.innerHeight) return;
        window.resizeTo(width, height);
    }
    get isPlaylistOpen() {
        return this.#isPlaylistOpen;
    }
    set isPlaylistOpen(value) {
        if (typeof value === 'boolean') {
            this.#isPlaylistOpen = value;
        }
    }
    get width() {
        if (window.outerWidth < 250 + this.frameWidth) {
            return 250 + this.frameWidth;
        }
        return window.outerWidth; // + this.frameWidth;
    }
    set width(value) {
        if (!Number.isInteger(value)) return;
        this.#width = value + this.frameWidth;
    }

    get height() {
        if (this.#height < 110 + this.frameHeight) {
            return 110 + this.frameHeight;
        }
        return this.#height;
    }
    set height(value) {
        if (!Number.isInteger(value)) return;
        this.#height = value + this.frameHeight;
    }

    get playlistHeight() {
        if (this.#playlistHeight < 270 + this.frameHeight) {
            return 270 + this.frameHeight;
        }
        return this.#playlistHeight;
    }
    set playlistHeight(value) {
        if (!Number.isInteger(value)) return;
        this.#playlistHeight = value + this.frameHeight;
    }

    get frameHeight() {
        return window.outerHeight - window.innerHeight;
    }
    get frameWidth() {
        return window.outerWidth - window.innerWidth;
    }

}
let popupWindow = new PopupWindow();

/** @param {boolean} show playlist or hide  */ 
let togglePlaylist = (show) => {
    if (show == undefined) { show = !popupWindow.isPlaylistOpen; }
    if (typeof hamburgerMenuList != "undefined") {
        hamburgerMenuList.classList.toggle("change-list", show);
        let keyframeHamburger = { opacity: ['1', '0'] };
        let optionsHamburger = { duration: 450 };
        let animH = hamburgerMenuList.animate(keyframeHamburger, optionsHamburger);
        if (show) {
            animH.onfinish = () => {
                hamburgerMenuList.classList.add("playlist-open");
                hamburgerMenuList.style.top = "120px";
                hamburgerMenuList.style.right = "10px";
                keyframeHamburger = { opacity: ['0', '1'] };
                hamburgerMenuList.animate(keyframeHamburger, optionsHamburger);
            }
        } else {
            animH.onfinish = () => {
                hamburgerMenuList.classList.remove("playlist-open");
                hamburgerMenuList.style.top = "0px";
                hamburgerMenuList.style.right = "";
                keyframeHamburger = { opacity: ['0', '1'] };
                hamburgerMenuList.animate(keyframeHamburger, optionsHamburger);
            }
        }
    }
    if (show) {
        popupWindow.x = screenLeft;
        popupWindow.y = screenTop;
        //popupWindow.height = window.innerHeight;
        popupWindow.resizeTo(popupWindow.width, popupWindow.playlistHeight);

        keyframe = {
            height: ['0px', '100vh'],
            easing: ['cubic-bezier(.85, .2, 1, 1)']
        };

        let options = { duration: 500 }
        list.style.overflowY = "hidden"
        list.style.display = "flex";
        let anim = list.animate(keyframe, options);
        popupWindow.isPlaylistOpen = true;
        anim.onfinish = () => {
            list.style.height = "auto";
            list.style.overflowY = "auto";
            scrollToSelected();
        }
        // playlist open
    } else {
        keyframe = {
            height: ['100vh', '0px'],
            easing: ['cubic-bezier(.85, .2, 1, 1)']
        };

        let options = { duration: 500 }
        list.style.overflowY = "hidden"
        let anim = list.animate(keyframe, options);
        popupWindow.isPlaylistOpen = false;
        anim.onfinish = () => {
            list.style.display = "none";
            popupWindow.resizeTo(popupWindow.width, popupWindow.height);
            if (popupWindow.x != screenLeft) {
                window.moveTo(screenLeft, screenTop);
                return;
            }
            window.moveTo(popupWindow.x, popupWindow.y);
            anim.onfinish = null;
        }
        // playlist close

    }
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

let notificationTimer;
let showNotification = (text) => {
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
    notificationTimer = setTimeout(() => {
        notification.classList.remove("slide-bottom");
        let keyframe = {
            transform: ['translateY(0%)', 'translateY(-100%)'],
        };
        notification.animate(keyframe, options);
        notificationTimer;
    }, 5000);

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

let onMessageAddListener = () => {
    port.onDisconnect.addListener((disconnect) => {
        Extension.isConnected = false;
        port.isConnected = false;
        changeState(false);
        stopUpdater();
        showNoConnected();

    });
    port.onMessage.addListener(function(request) {
        if (request.response) {
            response(request.response);
        }
    });
    let response = (answer) => {
        switch (answer.case) {
            case "extensionIsLoad":
                if (answer.isConnect) {
                    Extension.isConnected = true
                } else {
                    Extension.isConnected = false;
                    showNoConnected();
                    console.log("No connection");
                }
                break;
        }
    }
}

let sendEvent = (event, isResponse = false, forceObject = false) => {
    if (typeof(event) != "object") event = { data: event };
    if (forceObject) event = { data: event };
    port.postMessage(event);

}

let removeLastWorld = (textElement) => {
    textElement.trim();
    let lastIndex = textElement.lastIndexOf(" ");
    textElement = textElement.substring(0, lastIndex);
    if (textElement.endsWith(",")) {
        textElement = textElement.substring(0, lastIndex - 1);
    }
    return textElement;
}
let setRightSize = (element, maxWidth, maxHeight, fontSize = 1) => {
    let width = element.offsetWidth;
    let height = element.offsetHeight;
    if (width > maxWidth || height > maxHeight) {
        element.innerHTML = removeLastWorld(element.innerHTML) + "...";
    }
    if (width > maxWidth || height > maxHeight) {
        setRightSize(element, maxWidth, maxHeight);
    }
}

let setMediaData = (trackTitle, trackArtists, iconTrack) => {
    artistsName[0].innerHTML = trackArtists;
    trackName[0].innerHTML = trackTitle;
    artistsName[0].style.fontSize = "";
    trackName[0].style.fontSize = "";
    urlCover = getUrl(iconTrack, 50);
    trackImage[0].style.backgroundImage = "url(" + urlCover + ")";
}

let changeState = (isPlaying) => {
    if (State.isPlay == isPlaying) {
        return;
    } else {
        State.isPlay = isPlaying;
    }
    if (isPlaying == false) {
        pause[0].style.backgroundImage = "url(img/play.png)";
        if (Options.isReduce) {
            pause[0].style.backgroundPosition = "2px center";
            return;
        }
        pause[0].style.backgroundPosition = "2px center";
    } else {
        pause[0].style.backgroundImage = "";
        pause[0].style.backgroundPosition = "";
        pause[0].style.backgroundSize = "";
    }
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
        modalCover[0].onerror = function() {
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

    } catch (error) { console.log(error); }
}

let animateMainImage = (item) => {
    let width = item.offsetWidth;
    let height = item.offsetHeight;
    let left = -(window.innerWidth / 2 - width / 2 - item.offsetLeft);
    let top = -(window.innerHeight / 2 - height / 2 - item.offsetTop);

    let sizeCover, borderRadius;
    let style = getComputedStyle(item);
    borderRadius = parseInt(style.borderRadius.slice(0, -2));
    if (window.innerHeight > window.innerWidth) {
        sizeCover = window.innerWidth - Math.ceil(15 * window.innerWidth / 100);
        modalCover[0].style.width = sizeCover + "px";
        modalCover[0].style.height = sizeCover + "px";
    } else {
        sizeCover = window.innerHeight - Math.ceil(15 * window.innerHeight / 100);
        modalCover[0].style.width = sizeCover + "px";
        modalCover[0].style.height = sizeCover + "px";
    }
    keyframe = {
        width: [width + 'px', sizeCover + 'px'],
        height: [height + 'px', sizeCover + 'px'],
        transform: ['translate(' + left + 'px, ' + top + 'px)', 'translate(0px, 0px)'],
        borderRadius: [borderRadius + 'px', '20px'],
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

let openCover = (item, url, animate = animateMainImage) => {
        testImage(url, 400, { animate: animate, parameter: item });
    }
    //END EXTENSION

// START OPTIONS
let Options = {
    onload: function() {
        sendEventBackground({ getOptions: true }, setOptions);
    },
    isPlayPauseNotify: undefined,
    isPrevNextNotify: undefined,
    isShowWhatNew: undefined,
    version: undefined,
    oldVersionDescription: undefined,
    isReduce: false,
    popupBounds: undefined
};

let sendEventBackground = (event, callback) => { // event should be as object.
    chrome.runtime.sendMessage(event, function(response) {
        if (response != undefined) {
            if (response.options) {
                setOptions(response.options); 
            }
            if (callback != undefined) {
                callback(response);
            }
        }
    });
};

let setOptions = (options) => {
    if (options.theme != undefined) {
        switch (options.theme) {
            case "default":
                Options.theme = options.theme;
                setTheme("default", Extension.currentWindow().name);
                break;
            case "light":
                Options.theme = options.theme;
                setTheme("light", Extension.currentWindow().name);
                break;
            case "dark":
                Options.theme = options.theme;
                setTheme("dark", Extension.currentWindow().name);
                break
        }
    }
    if (options.isDarkTheme != undefined) { // remove it on next update
        Options.isDarkTheme = options.isDarkTheme;
        if (options.isDarkTheme == true) {
            setDarkTheme("dark");
        }
    }
    if (options.isCoverIncrease != undefined) {
        Options.isCoverIncrease = options.isCoverIncrease;
        try {
            if (options.isCoverIncrease) {
                setIncreaseCover(true);
            } else {
                setIncreaseCover(false);
            }
        } catch (error) { console.log(error) }
    }
    if (options.isDislikeButton != undefined) {
        Options.isDislikeButton = options.isDislikeButton;
        if (options.isDislikeButton) {
            dislike.style.display = "block";
            setIncreaseCover(true);
        } else {
            dislike.style.display = "none";
            if (Options.isCoverIncrease == false) {
                setIncreaseCover(false);
            }
        }
    }
    if (options.popupBounds != undefined) {
        Options.popupBounds = options.popupBounds;
        //this
        popupWindow.playlistHeight = options.popupBounds.playlistHeight;
        popupWindow.height = options.popupBounds.height;
        if (options.popupBounds.isTrackListOpen) {
            togglePlaylist(true);
            return;
        }
        popupWindow.correctMinSize();
    }
}
    // END OPTIONS
Options.onload();
Extension.onload();
