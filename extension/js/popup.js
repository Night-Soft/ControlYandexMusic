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
let notificationTimeLeft = document.getElementsByClassName("notification-time-left")[0];
let closeNotification = document.getElementsByClassName("close-notification")[0];
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
    onload: function () {
        this.createConnection().then((result) => {
            if (result) {
                sendEvent("extensionIsLoad");
            }
        });
    },
    createConnection: async () => {
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
    windowName: window.location.pathname == '/side-panel.html' ? "side-panel" : "popup",
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
        if(request.event == "change_track") {
            State.stopUpdater();
            State.position = 0;
        } 
    });

chrome.runtime.onMessageExternal.addListener( // injected script
    (request, sender, sendResponse) => {
        switch (request.event) {
            case 'currentTrack': // get from the key
                if (request.trackInfo.index == -1) {
                    showNotification(chrome.i18n.getMessage("playlistEmpty"), 7000);
                    return;
                }

                setMediaData(request.currentTrack.title, getArtists(request.currentTrack, 5), request.currentTrack.cover);
                setPlaybackStateStyle(request.isPlaying);
                toggleLike(request.currentTrack.liked);
                toggleDislike(request.currentTrack.disliked);

                State.isPlay = request.isPlaying;
                State.volume = request.volume;
                State.isRepeat = request.controls.repeat;
                State.isShuffle = request.controls.shuffle;

                if (request.progress.duration != 0) {
                    State.setProgress(request.progress);
                } else {
                    State.stopUpdater();
                    State.duration = request.currentTrack.duration;
                    State.position = 0;
                }

                updateTracksList(request.trackInfo);
                break;
            case 'togglePause':
                State.isPlay = request.isPlaying;
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
            case "TRACKS_LIST":
                updateTracksList(request);
                break;
            case "STATE":
                State.isPlay = request.isPlaying;
                State.position = request.progress.position;
                break;
            case "CONTROLS":
                State.isRepeat = request.repeat;
                State.isShuffle = request.shuffle;
                break;
            case "VOLUME":
                State.volume = request.volume;
                break;
            case "SPEED":
                State.speed = request.speed;
                State.setProgress(request.progress);
                break;
            case "PROGRESS":
                State.setProgress(request.progress);
                break;
            case "page_hide":
                if (reload == true) return;
                sendEventBackground({ isConnected: false })
                window.close();
                break;
        }
    });

let boundsChangedId;
chrome.windows.onBoundsChanged.addListener((ev) => {
    if (Extension.windowName == "side-panel") return;
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
    State.stopUpdater();
};

pause[0].onclick = () => {
    sendEvent("togglePause");
};

next[0].onclick = () => {
    sendEvent("next");
    State.stopUpdater();
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
    openCoverAnimate(CoverAnimation.element, true);
}

closeNotification.onclick = function() {
    notificationTimeLeft.removeEventListener("transitionend", NotificationControl.boundListener);
    NotificationControl.closeNotification.apply(NotificationControl);
}
notification.onmouseenter = () => {
    NotificationControl.stayShown();
}
notification.onmouseleave = () => {
    if (NotificationControl.isShown) {
        NotificationControl.hide(2500);
    }
}

let list = document.getElementById("listTrack");

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
        }, (reject) => { });

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

/** @param {boolean} show show playlist or hide  */
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

if (typeof hamburgerMenuList != "undefined") {
    hamburgerMenuList.onclick = () => { togglePlaylist(); }
} else {
    if (Extension.windowName == "side-panel") {
        togglePlaylist(true);
    }
}

let onMessageAddListener = () => {
    port.onDisconnect.addListener((disconnect) => {
        Extension.isConnected = false;
        port.isConnected = false;
        setPlaybackStateStyle(false);
        showNoConnected();

    });
    port.onMessage.addListener(function (request) {
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

let setMediaData = (trackTitle, trackArtists, iconTrack) => {
    artistsName[0].innerHTML = trackArtists;
    trackName[0].innerHTML = trackTitle;
    artistsName[0].style.fontSize = "";
    trackName[0].style.fontSize = "";
    urlCover = getUrl(iconTrack, 50);
    trackImage[0].style.backgroundImage = "url(" + urlCover + ")";
}

let setPlaybackStateStyle = (isPlaying) => {
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

//END EXTENSION

// START OPTIONS
let Options = {
    onload: function () {
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
    chrome.runtime.sendMessage(event, function (response) {
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
                setTheme("default", Extension.windowName);
                break;
            case "light":
                Options.theme = options.theme;
                setTheme("light", Extension.windowName);
                break;
            case "dark":
                Options.theme = options.theme;
                setTheme("dark", Extension.windowName);
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
            if (Extension.windowName == "popup") {
                togglePlaylist(true);
            }
            return;
        }
        popupWindow.correctMinSize();
    }
}
// END OPTIONS
Options.onload();
Extension.onload();
