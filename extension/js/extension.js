let previous = document.getElementsByClassName("previous");
let pause = document.getElementsByClassName("pause");
let next = document.getElementsByClassName("next");
let title = document.getElementsByClassName("title");
let trackName = document.getElementsByClassName("name-track");
let aritstName = document.getElementsByClassName("name-artists");
let trackImage = document.getElementsByClassName("cover");
let modal = document.getElementsByClassName("modal");
let modalCover = document.getElementsByClassName("modal-cover");
let like = document.getElementsByClassName("like");
let contactMe = document.getElementById("contactMe");
let btnYes = document.getElementById("Yes");
let bntNo = document.getElementById("No");
let btnNew = document.getElementById("New");
let appDetected = document.getElementById("AppDetected");
let appQuestion = document.getElementById("AppQuestion");
let shortCuts = document.getElementById("shortCuts");
let showNotify = document.getElementById("showNotify");
let listSettings = document.getElementById("listSettings");
let yesNews = document.getElementById("YesNews");
let whatNew = document.getElementById("whatNew");
let sett = document.getElementById("settings");

let container = document.getElementsByClassName("container")[0];
let containerMenu = document.getElementsByClassName("content-menu")[0];
let about = document.getElementsByClassName("side")[3];
let supportMenu = document.getElementsByClassName("support-menu")[0];
let closeSide = document.getElementsByClassName("close-side")[0];
let aMenu = document.getElementsByTagName("a")[0];
let payPal = document.getElementsByClassName("paypal-menu")[0];
let donationAlerts = document.getElementsByClassName("donationalerts-menu")[0];
let sideHelp = document.getElementsByClassName("side-help")[0];
let noConnect = document.getElementsByClassName("no-connect")[0];
let loaderContainer = document.getElementsByClassName("loader-container")[0];
let yesNoNew = document.getElementsByClassName("yes-no-new")[0];
let settings = document.getElementsByClassName("settings")[0];
let transition = document.getElementsByClassName("transition");
let hamburgerMenuList = document.getElementsByClassName("hamburger-menu-list")[0];
let modalNews = document.querySelector(".modal-news");
let dislike = document.getElementsByClassName("dislike")[0];
let notification = document.getElementsByClassName("notification")[0];
let textNotification = document.getElementsByClassName("h2-notification")[0];
let notificationTrackName = document.getElementsByClassName("notification-track-name")[0];
let popupBtn = document.getElementsByClassName("popup-btn")[0];
let listsSortcutKeys = document.getElementsByClassName("list-shortcut-keys")[0];
let selectedShortcutKey = document.getElementsByClassName("select-shortcut-key")[0];
let contentListMenu = document.getElementsByClassName("content-list-menu")[0];
let modalListMenu = document.getElementsByClassName("modal-list-menu")[0];
let loadedLine = document.getElementsByClassName("loaded")[0];


let port = {
    isConnected: false
};

let isMenuListOpen = false;
let isMenuOpen = false;
let reload = true;
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
    currentWindow() {
        return { name: "extension" }
    },
    isConnected: undefined
};

chrome.runtime.onMessage.addListener( // background, content script
    (request, sender, sendResponse) => {
        if (request.onload == true) {
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
                    active: true
                });
            });
        }
        if (request.options) {
            setOptions(request.options);
            if (request.options.isShowWhatNew) {
                checkNew();
            }
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
                State.position = request.progress.position;
                State.isPlay = request.isPlaying;
                setTrackProgress();
                trackUpdater();
                break;
            case 'togglePause':
                changeState(request.isPlaying);
                trackUpdater(State.duration, State.position, State.isPlay = request.isPlaying);
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
                trackUpdater(State.duration, State.position, State.isPlay = request.isPlaying);
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
            State.likeItem = likeItems[request.trackInfo.index];
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
            for (const prop in request.progress) {
                if (Object.hasOwn(request.progress, prop)) {
                    State[prop] = request.progress[prop];
                }
            }
            updateProgress();
            trackUpdater();
        }
        return true;
    });

let LongPressButton = class {
    constructor(button, func, delay = 750) {
        this.button = button;
        this.func = func;
        this.delay = delay;
        this.longpresStart = true;
        this.longpressTimer;
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
    if (reload == false) {
        openNewTab();
    } else {
        chrome.tabs.query({
            windowType: "normal"
        }, (tabs) => {
            for (let i = tabs.length - 1; i >= 0; i--) {
                if (tabs[i].url.startsWith("https://music.yandex")) {
                    chrome.tabs.reload(tabs[i].id);
                    loaderContainer.style.display = "block";
                    appDetected.innerHTML = chrome.i18n.getMessage("waitWhilePage");
                    appQuestion.style.display = "none";
                    yesNoNew.style.display = "none";
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
    pushEvent(previous[0].className, "clicked")
};

pause[0].onclick = () => {
    sendEvent("togglePause");
    pushEvent(pause[0].className, "clicked")
};

next[0].onclick = () => {
    sendEvent("next");
    stopUpdater();
    pushEvent(next[0].className, "clicked")
};
like[0].onLongPress = new LongPressButton(like[0], () => {
    sendEvent("toggleDislike");
});

like[0].onclick = () => {
    sendEvent("toggleLike");
    pushEvent(like[0].className, "clicked");
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
    pushEvent("Cover open", "clicked")
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

// list settings

container.onclick = () => {
    toggleMenu();
}

about.onclick = () => {
    chrome.tabs.create({
        url: "about.html"
    })
    pushEvent(about.className)

}

popupBtn.onclick = () => {
    sendEventBackground({ createPopup: true },
        (result) => {
            if (result.exists && result.isCreated) {
                showNotification(result.message, 5500);
            } else if (result.exists) {
                showNotification(result.message, 5500);
            }
        });
}

let isSettingsOpen = false;
let setKeyDescription = (clear = false, shortcutKey, result) => {
    selectedShortcutKey.style.background = "";
    if (clear) {
        let checkBoxReassignT = document.getElementById("checkBoxReassign");
        checkBoxReassignT.innerHTML = chrome.i18n.getMessage("noShortcutSelected");
        selectedShortcutKey.innerHTML = chrome.i18n.getMessage("selectedShortcutKey");
        for (let j = 0; j < listsSortcutKeys.children.length; j++) {
            listsSortcutKeys.childNodes[j].style.background = "";
        }
        return;
    } else {
        if (shortcutKey != undefined) {
            selectedShortcutKey.innerHTML = shortcutKey.innerHTML;
            if (result != undefined) {
                if (result.shortcut != undefined && result.shortcut != '') {
                    selectedShortcutKey.innerHTML = chrome.i18n.getMessage("openPopup") + result.shortcut + "'";
                } else if (result.name != undefined) {
                    selectedShortcutKey.style.background = "#DB0000"
                    selectedShortcutKey.innerHTML = "'" + result.description + "' " + chrome.i18n.getMessage("isNoKeyAction");
                }
            }
        }
        try {
            if (result == undefined) {
                let checkBoxReassignT = document.getElementById("checkBoxReassign");
                checkBoxReassignT.innerHTML = chrome.i18n.getMessage("noShortcutSelected");
                return;
            }
            let checkBoxReassignT = document.getElementById("checkBoxReassign");
            let checkBoxReassignText = chrome.i18n.getMessage("checkBoxReassignFirstHalf") + result.description + chrome.i18n.getMessage("checkBoxReassignSecondHalf");
            checkBoxReassignT.innerHTML = checkBoxReassignText;
            if (result.shortcut != undefined && result.shortcut != '') {
                selectedShortcutKey.innerHTML = chrome.i18n.getMessage("openPopup") + result.shortcut + "'";
            } else if (result.name != undefined) {
                selectedShortcutKey.style.background = "#DB0000"
                selectedShortcutKey.innerHTML = "'" + result.description + "' " + chrome.i18n.getMessage("isNoKeyAction");
            }
        } catch (error) {}
    }
}
settings.onclick = (event) => {
    if (event.target == settings || event.target == sett || event.target == listSettings) {
        if (isSettingsOpen) {
            listSettings.classList.remove("scale-from-top");
            listSettings.className += " scale-from-top-out";
            listSettings.addEventListener("animationend", endAnimationList);
            isSettingsOpen = false;
        } else {
            settings.style.background = "var(--mainRed)";
            settings.style.padding = "15px";
            settings.style.color = "white";
            settings.style.borderRadius = "5px";
            listSettings.removeEventListener("animationend", endAnimationList);
            listSettings.classList.remove("scale-from-top-out");
            listSettings.className += " scale-from-top";
            listSettings.style.display = "flex";
            isSettingsOpen = true;
            listsSortcutKeys.innerHTML = "";

            chrome.commands.getAll().then((result) => {
                for (let i = 0; i < result.length; i++) {
                    let shortcutKey = document.createElement("DIV");
                    shortcutKey.classList.add("shortcut-key");
                    shortcutKey.innerHTML = result[i].description + " " + result[i].shortcut;
                    try {
                        if (Options.reassign.shortCut.index == i) {
                            // set shortcut if previously not set
                            Options.reassign.shortCut.shortcut = result[i].shortcut;
                            setKeyDescription(false, shortcutKey, result[i]);
                        }
                    } catch (error) {}
                    shortcutKey.onclick = (ev) => {
                        if (Options.selectedShortcutKey != undefined) {
                            if (result[i].name == Options.selectedShortcutKey.name) {
                                listsSortcutKeys.childNodes[i].style.background = "";
                                Options.selectedShortcutKey = undefined;
                                setKeyDescription(true);
                                if (checkBoxReassign.checked) {
                                    checkBoxReassign.checked = false;
                                    sendEventBackground({
                                        writeOptions: true,
                                        options: {
                                            reassign: {
                                                isReassign: checkBoxReassign.checked,
                                                shortCut: Options.selectedShortcutKey
                                            },
                                        }
                                    });
                                    setOptions({
                                        reassign: {
                                            isReassign: checkBoxReassign.checked,
                                            shortCut: Options.selectedShortcutKey
                                        }
                                    });
                                }
                                return;
                            }
                        }
                        Options.selectedShortcutKey = result[i];
                        Options.selectedShortcutKey.index = i;
                        if (result[i].shortcut == '') {
                            showNotification(chrome.i18n.getMessage("noShortcutKeyAction"));
                        }
                        shortcutKey.style.background = "#FF2222";
                        for (let j = 0; j < listsSortcutKeys.children.length; j++) {
                            if (j != i) {
                                listsSortcutKeys.childNodes[j].style.background = "";
                            }
                        }
                        setKeyDescription(false, shortcutKey, result[i]);
                        if (checkBoxReassign.checked) {
                            sendEventBackground({
                                writeOptions: true,
                                options: {
                                    reassign: {
                                        isReassign: checkBoxReassign.checked,
                                        shortCut: Options.selectedShortcutKey
                                    },
                                }
                            });
                            setOptions({
                                reassign: {
                                    isReassign: checkBoxReassign.checked,
                                    shortCut: Options.selectedShortcutKey
                                }
                            });
                        }
                    }
                    listsSortcutKeys.appendChild(shortcutKey);
                    if (Options.reassign.isReassign) {
                        if (Options.reassign.shortCut.index == i) {
                            shortcutKey.style.background = "#FF2222";
                        }
                    }
                }
            });
        }
    }
}

let timeToClose;
settings.onmouseleave = () => {
    if (isSettingsOpen) return;
    settings.style.background = "";
    settings.style.padding = "";
    settings.style.color = "";
    settings.style.borderRadius = "";
}
settings.onmouseenter = () => {
    if (timeToClose != undefined) {
        clearTimeout(timeToClose);
    }
}

let endAnimationList = () => {
    listSettings.classList.remove("scale-from-top-out");
    listSettings.classList.remove("scale-from-top");
    listSettings.style.display = "none";
    listSettings.removeEventListener("animationend", endAnimationList);
}

contactMe.onclick = () => {
    window.open("mailto:nightsoftware@outlook.com");
}

whatNew.onclick = () => {
    WhatNew.openNews();
}

shortCuts.onclick = () => {
    chrome.tabs.create({
        url: "chrome://extensions/shortcuts"
    });
}

supportMenu.onclick = () => {}
    // payPal.onclick = () => {
    //     pushEvent("payPal");
    //     window.open("https://www.paypal.com/paypalme2/NightSoftware");

// }

donationAlerts.onclick = () => {
    pushEvent("donationAlerts");
    window.open("https://www.donationalerts.com/r/nightsoftware");
}

donationAlerts.onmouseenter = () => {
    sideHelp.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
}

sideHelp.onmouseenter = (event) => {
    //payPal.style.display = "block";
    donationAlerts.style.display = "flex";
    sideHelp.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
}

sideHelp.onmouseleave = () => {
    //payPal.style.display = "none";
    donationAlerts.style.display = "none";
}

aMenu.onclick = () => {
    window.open("mailto:nightsoftware@outlook.com");
}

closeSide.onclick = () => {
    toggleMenu();
}

modalListMenu.onclick = (e) => {
    if (e.target !== modalListMenu) {
        return;
    }
    toggleListMenu();
}

hamburgerMenuList.onclick = () => {
    toggleListMenu();
}

let toggleListMenu = () => {
    hamburgerMenuList.classList.toggle("change-list");
    let removeOpacity = () => {
        modalListMenu.classList.remove("opacity");
        modalListMenu.removeEventListener("animationend", removeOpacity);
        scrollToSelected();
    }
    let removeOpacityReverse = () => { // run after 0.7s
        modalListMenu.classList.remove("opacity-reverse");
        modalListMenu.style.display = "none"
        modalListMenu.removeEventListener("animationend", removeOpacityReverse);
    }
    let endListAnimation = (ev) => {
        modalListMenu.style.display = "none"
        isMenuListOpen = false;
        contentListMenu.removeEventListener("animationend", endListAnimation);
    }
    if (isMenuListOpen == false) { // open menu
        modalListMenu.addEventListener("animationend", removeOpacity);
        modalListMenu.classList.add("opacity");
        contentListMenu.classList.add("slide-left");
        modalListMenu.style.display = "block";
        isMenuListOpen = true;
    } else {
        modalListMenu.classList.add("opacity-reverse");
        modalListMenu.addEventListener("animationend", removeOpacityReverse);
        contentListMenu.classList.remove("slide-left");
        contentListMenu.classList.add("slide-left-out");
        contentListMenu.addEventListener("animationend", endListAnimation);

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
let showNotification = (text, time) => {
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
    if (time == undefined) {
        time = text.length * 84 + options.duration * 2 + 100;
        if (time <= options.duration * 2 + 500) { // + 500ms for focus 
            time = options.duration * 2 + 500;
        }
    }
    notificationTimer = setTimeout(() => {
        notification.classList.remove("slide-bottom");

        let keyframe = {
            transform: ['translateY(0%)', 'translateY(-100%)'],
        };
        notification.animate(keyframe, options);
        notificationTimer;
    }, time);
}

let endAnimation = (ev) => {
    ev.stopPropagation();
    isMenuOpen = false;
    containerMenu.removeEventListener("animationend", endAnimation);
}

let toggleMenu = () => {
    container.classList.toggle("change");
    let modalSide = document.getElementsByClassName("modal-side")[0];
    let removeOpacity = () => {
        modalSide.classList.remove("opacity");
        modalSide.removeEventListener("animationend", removeOpacity);
    }
    let removeOpacityReverse = () => { // run aferr 0.7s
        modalSide.classList.remove("opacity-reverse");
        modalSide.style.display = "none"
        modalSide.removeEventListener("animationend", removeOpacityReverse);
    }
    if (isMenuOpen == false) { // Menu is open! Why is exactly so that? I don't know, it just happened!
        modalSide.addEventListener("animationend", removeOpacity);
        modalSide.classList.add("opacity");
        containerMenu.style.display = "flex";
        modalSide.style.display = "block"
        containerMenu.className = containerMenu.className.replace(" slide-out", " slide-right");
        isMenuOpen = true;
    } else {
        modalSide.classList.add("opacity-reverse");
        modalSide.addEventListener("animationend", removeOpacityReverse);
        containerMenu.className = containerMenu.className.replace(" slide-right", " slide-out");
        addAnimListener();
    }
}

let addAnimListener = () => {
    if (isMenuOpen == true) {
        containerMenu.addEventListener("animationend", endAnimation);
    }
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

let setRightFontSize = (fontSize = 1.4) => {
    let heightArtist = aritstName[0].offsetHeight;
    let heightTrack = trackName[0].offsetHeight;

    if (heightArtist + heightTrack > 150) {
        fontSize = fontSize - 0.05;
        fontSize = fontSize.toFixed(2);
        aritstName[0].style.fontSize = fontSize + "rem";
        trackName[0].style.fontSize = fontSize + "rem";
        setRightFontSize(fontSize);
    }
}

let setMediaData = (trackTitle, trackArtists, iconTrack) => {
    aritstName[0].innerHTML = trackArtists;
    trackName[0].innerHTML = trackTitle;
    aritstName[0].style.fontSize = "";
    trackName[0].style.fontSize = "";
    setRightFontSize();
    urlCover = getUrl(iconTrack, 200);
    trackImage[0].style.backgroundImage = "url(" + urlCover + ")";
}

let changeState = (isPlaying) => {
    if (State.isPlay != isPlaying) {
        State.isPlay = isPlaying;
    }
    if (isPlaying == false) {
        pause[0].style.backgroundImage = "url(img/play.png)";
        if (Options.isReduce) {
            pause[0].style.backgroundPosition = "16px center";
            return;
        }
        pause[0].style.backgroundPosition = "20px center";
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

let pushEvent = (target, event) => {
    //gtag('event', target, event);
}