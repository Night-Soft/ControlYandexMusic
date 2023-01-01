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

let isMenuListOpen = false;
let fromPopup = true;
let reload = true;
let urlCover;

let Extension = {
    onload: function() {
        sendEvent("extensionIsLoad", true);
        Extension.addTransition();
    },
    addTransition: () => {
        transition[0].style.transition = "0.7s"
        transition[1].style.transition = "0.7s"
        transition[2].style.transition = "0.7s"
    },
    isConnected: undefined
};

chrome.runtime.onMessage.addListener( // background, content script
    (request, sender, sendResponse) => {
        console.log("request", request);
        if (request.onload) {
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
        // if (request.keyOpenPage) {
        //     openNewTab();
        // }
    });

chrome.runtime.onMessageExternal.addListener( // injected script
    (request, sender, sendResponse) => {
        console.log("onMessageExternal popup", request);

        switch (request.event) {
            case 'currentTrack': // get from the key
                setMediaData(request.currentTrack.title, getArtists(request.currentTrack, 5), request.currentTrack.cover);
                changeState(request.isPlaying);
                toggleLike(request.currentTrack.liked);
                //toggleListLike(request.currentTrack.liked)
                toggleDislike(request.currentTrack.disliked);
                getDuration(request.currentTrack.duration);
                getProgress(request.progress.position);
                getIsPlay(request.isPlaying);
                setTrackProgress();
                trackUpdater();
                break;
            case 'togglePause':
                changeState(request.isPlaying);
                trackUpdater(getDuration(), getProgress(), getIsPlay(request.isPlaying));
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
            updateVolume(request.volume);
        }
        if (request.hasOwnProperty('repeat')) {
            updateRepeat(request.repeat);
        }
        if (request.hasOwnProperty('shuffle')) {
            updateShuffle(request.shuffle);
        }
        if (request.hasOwnProperty('progress')) {
            if (Object.keys(request).length == 1) {
                getProgress(request.progress.position);
                if (request.progress.position == 0) {
                    setTimeout(() => {
                        trackUpdater();
                    }, 500);
                } else {
                    trackUpdater();
                }
            }
        }
        if (request.pagehide) {
            if (reload) return;
            sendEventBackground({ isConnected: false })
            window.close();
        }
        return true;
    });
let FontSize = {
    size: 1.15,
    maxPx: 40,
    ifMore: true,
    ifLess: false
}
chrome.windows.onBoundsChanged.addListener(
    function(ev) {
        if (popupPosition.windowId == ev.id) {
            console.log("send for save bounds", ev);
            ev.isTrackListOpen = isMenuListOpen;
            ev.prevPlaylistHeight = popupPosition.prevPlaylistHeight;
            sendEventBackground({ popupBounds: ev });
            if (FontSize.ifMore) {
                if (ev.height > 370) {
                    console.log("ifMore")
                    FontSize.size = 1.3;
                    FontSize.maxPx = 50;
                    FontSize.ifMore = false;
                    FontSize.ifLess = true;
                    setRightFontSize(FontSize.size, FontSize.maxPx, true);
                }
            }
            if (FontSize.ifLess) {
                if (ev.height < 370) {
                    console.log("ifLess")
                    FontSize.size = 1.15;
                    FontSize.maxPx = 40;
                    FontSize.ifLess = false;
                    FontSize.ifMore = true;
                    setRightFontSize(FontSize.size, FontSize.maxPx, true);
                }
            }
        }
    }
)
let LongPressButton = class {
    constructor(button, func, delay = 750) {
        this.button = button;
        this.delay = delay;
        this.longpresStart = true;
        this.longpressTimer;
        this.func = func;
        this.onclickFunc;

        button.onmousedown = (event) => {
            if (event.button == 2) {
                return;
            }
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
    if (reload == true) {
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

hamburgerMenuList.onclick = () => { toggleListMenu(); }
let PopupPosition = class {
    constructor() {
        if (!PopupPosition.instance) {
            PopupPosition.instance = this;
        } else {
            return PopupPosition.instance
        }
        let popupWindow = chrome.windows.getAll({ populate: true, windowTypes: ['popup'] });
        popupWindow.then((result) => {
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
        this.width = 250;
        this.height = 110;
        this.playlistHeight = 270;
        this.prevPlaylistHeight = 0;
        this.windowId;
    }

}
let popupPosition = new PopupPosition();

let toggleListMenu = () => {
    hamburgerMenuList.classList.toggle("change-list");
    if (isMenuListOpen == false) {
        popupPosition.x = screenLeft;
        popupPosition.y = screenTop;
        if (window.innerHeight < popupPosition.playlistHeight) {
            if (popupPosition.prevPlaylistHeight <= popupPosition.playlistHeight) {
                if (window.innerWidth <= popupPosition.width) {
                    window.resizeTo(popupPosition.width, popupPosition.playlistHeight);
                } else {
                    window.resizeTo(window.innerWidth, popupPosition.playlistHeight);
                }
            } else {
                if (window.innerWidth <= popupPosition.width) {
                    window.resizeTo(popupPosition.width, window.prevPlaylistHeight);
                } else {
                    window.resizeTo(window.innerWidth, popupPosition.prevPlaylistHeight);
                }
            }
        }
        keyframe = {
            height: ['0px', '100vh'],
            easing: ['cubic-bezier(.85, .2, 1, 1)']
        };

        let options = {
            duration: 500,
        }
        list.style.overflowY = "hidden"
        list.style.display = "flex";
        let anim = list.animate(keyframe, options);
        isMenuListOpen = true;
        anim.onfinish = () => {
            list.style.overflowY = "auto"
            scrollToSelected();
        }
    } else {
        popupPosition.prevPlaylistHeight = window.innerHeight;
        keyframe = {
            height: ['100vh', '0px'],
            easing: ['cubic-bezier(.85, .2, 1, 1)']
        };

        let options = {
            duration: 500,
        }
        list.style.overflowY = "hidden"
        let anim = list.animate(keyframe, options);
        isMenuListOpen = false;
        anim.onfinish = () => {
            list.style.display = "none";
            window.resizeTo(window.innerWidth, popupPosition.height);
            if (popupPosition.x != screenLeft) {
                window.moveTo(screenLeft, screenTop);
                return;
            }
            window.moveTo(popupPosition.x, popupPosition.y);
        }
    }
}

let showNoConnected = (isTab = false) => {
    if (Extension.isConnected == false) {
        //sendEventBackground({ keyOpenPage: true });
        if (isTab) {
            appDetected.innerHTML = chrome.i18n.getMessage("appDetected");
            appQuestion.innerHTML = chrome.i18n.getMessage("appQuestion");
            bntNo.style.display = "none";
            btnYes.innerHTML = chrome.i18n.getMessage("reload");
            noConnect.style.display = "flex";
            noConnect.classList.add("puff-in-center");
            reload = false;
            return;
        } else {
            appDetected.innerHTML = chrome.i18n.getMessage("appNoDetected");
            appQuestion.innerHTML = chrome.i18n.getMessage("appNoQuestion");
            btnNew.style.display = "none";
            bntNo.style.display = "none";
            noConnect.style.display = "flex";
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

let toggleLike = (isLike) => {
    if (isLike) {
        like[0].style.backgroundImage = "url(img/like.png)";
    } else {
        like[0].style.backgroundImage = "url(img/notLike.png)";
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

let sendEvent = (event, isResponse = false, forceObject = false) => {
    if (typeof(event) != "object") event = { data: event };
    if (forceObject) event = { data: event };
    getYandexMusicTab().then((tab) => {
        if (tab) {
            chrome.tabs.sendMessage(tab, event, function(response) {
                if (isResponse) {
                    console.log("response", response);

                    if (event.data == "extensionIsLoad" && response == undefined) {
                        Extension.isConnected = false;
                        showNoConnected(tab);
                        console.log("No connection");
                    } else if (response.isConnect) {
                        Extension.isConnected = true
                    }
                }
            });
        } else {
            if (event.data == "extensionIsLoad") {
                Extension.isConnected = false;
                showNoConnected();
            }
        }
    }, (reject) => {});
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
let setRightFontSize = (fontSize = FontSize.size, px = FontSize.maxPx, setFont) => {
    if (setFont) {
        artistsName[0].style.fontSize = fontSize + "rem";
        trackName[0].style.fontSize = fontSize + "rem";
    }
    let heightArtist = artistsName[0].offsetHeight;
    let heightTrack = trackName[0].offsetHeight;

    if (heightArtist + heightTrack > px) {
        if (fontSize <= 0.85) {
            if (heightArtist > 20) {
                artistsName[0].innerHTML = removeLastWorld(artistsName[0].innerHTML) + "...";
                setRightFontSize(fontSize, px);
            }
            if (heightTrack > 20) {
                trackName[0].innerHTML = removeLastWorld(trackName[0].innerHTML) + "...";
                setRightFontSize(fontSize, px);
            }
        }
        fontSize = fontSize - 0.05;
        fontSize = fontSize.toFixed(2);
        artistsName[0].style.fontSize = fontSize + "rem";
        trackName[0].style.fontSize = fontSize + "rem";
        setRightFontSize(fontSize, px);
    }
}

let setMediaData = (trackTitle, trackArtists, iconTrack) => {
    artistsName[0].innerHTML = trackArtists;
    trackName[0].innerHTML = trackTitle;
    artistsName[0].style.fontSize = "";
    trackName[0].style.fontSize = "";
    setRightFontSize();
    urlCover = getUrl(iconTrack, 50);
    trackImage[0].style.backgroundImage = "url(" + urlCover + ")";
}

let changeState = (isPlaying) => {
    if (State.isPlay != isPlaying) {
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

    } catch (error) {
        console.log(error);
    }
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
        fill: 'both'
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
        console.log("response", response);
        if (response != undefined) {
            if (callback != undefined) {
                callback(response.options);
            }
        }
    });
};

let setOptions = (options) => {
        console.log("options", options)
        if (options.isDarkTheme != undefined) {
            Options.isDarkTheme = options.isDarkTheme;
            if (options.isDarkTheme) {
                setDarkTheme();
            } else {
                setDarkTheme(false);
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
            } catch (error) {
                console.log(error)
            }
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
            if (options.popupBounds.prevPlaylistHeight) {
                let popupPos = new PopupPosition();
                popupPos.prevPlaylistHeight = options.popupBounds.prevPlaylistHeight;
            }
            if (options.popupBounds.isTrackListOpen) {
                toggleListMenu();
            }

        }
    }
    // END OPTIONS
Options.onload();
Extension.onload();