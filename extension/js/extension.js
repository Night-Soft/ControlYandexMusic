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
let donateContainer = document.getElementsByClassName("donate-container")[0];
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
let notificationTimeLeft = document.getElementsByClassName("notification-time-left")[0];
let closeNotification = document.getElementsByClassName("close-notification")[0];
let textNotification = document.getElementsByClassName("h2-notification")[0];
let notificationTrackName = document.getElementsByClassName("notification-track-name")[0];
let popupBtn = document.getElementsByClassName("popup-btn")[0];
let listsSortcutKeys = document.getElementsByClassName("list-shortcut-keys")[0];
let selectedShortcutKey = document.getElementsByClassName("select-shortcut-key")[0];
let contentListMenu = document.getElementsByClassName("content-list-menu")[0];
let modalListMenu = document.getElementsByClassName("modal-list-menu")[0];

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
    windowName: "extension",
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
            case "change_track":
                State.stopUpdater();
                State.position = 0;
                break;
            case "page_hide":
                if (reload == true) return;
                sendEventBackground({ isConnected: false })
                window.close();
                break;
        }
    });


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

// list settings

container.onclick = () => {
    toggleMenu();
}

about.onclick = () => {
    chrome.tabs.create({
        url: "about.html"
    })
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
payPal.onclick = () => {
    window.open("https://www.paypal.com/paypalme2/NightSoftware");

}

donationAlerts.onclick = () => {
    window.open("https://www.donationalerts.com/r/nightapp");
}

donationAlerts.onmouseenter = () => {
    sideHelp.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
}

sideHelp.onmouseenter = (event) => {
    donateContainer.style.display = "flex";
    sideHelp.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
}

sideHelp.onmouseleave = () => {
    donateContainer.style.display = "none";
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
        isMenuListOpen = true;
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
    } else {
        modalListMenu.classList.add("opacity-reverse");
        modalListMenu.addEventListener("animationend", removeOpacityReverse);
        contentListMenu.classList.remove("slide-left");
        contentListMenu.classList.add("slide-left-out");
        contentListMenu.addEventListener("animationend", endListAnimation);

    }
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
        isMenuOpen = true;
    }
    let removeOpacityReverse = () => { // run aferr 0.7s
        modalSide.classList.remove("opacity-reverse");
        modalSide.style.display = "none"
        modalSide.removeEventListener("animationend", removeOpacityReverse);
    }
    if (isMenuOpen == false) {
        modalSide.addEventListener("animationend", removeOpacity);
        modalSide.classList.add("opacity");
        containerMenu.style.display = "flex";
        modalSide.style.display = "block"
        containerMenu.className = containerMenu.className.replace(" slide-out", " slide-right");
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

let setPlaybackStateStyle = (isPlaying) => {
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

FileReady.on('Extension');