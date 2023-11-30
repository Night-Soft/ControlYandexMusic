let previous = document.getElementsByClassName("previous");
let pause = document.getElementsByClassName("pause");
let next = document.getElementsByClassName("next");
let trackImage = document.getElementsByClassName("cover");
let artistsName = document.getElementsByClassName("name-artists");
let trackName = document.getElementsByClassName("name-track");
let modal = document.getElementsByClassName("modal");
let modalCover = document.getElementsByClassName("modal-cover");
let like = document.getElementsByClassName("like");
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
    isConnection: false
};

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
            getYandexMusicTab().then((tabId) => {
                if (tabId) {
                    try {
                        if (port.isConnection == false) {
                            port = chrome.tabs.connect(tabId, { name: chrome.runtime.id });
                            port.isConnection = true;
                        }
                    } catch (error) {
                        port.isConnection = false;
                    }
                    if (port.isConnection == false) {
                        showNoConnected();
                        resolve(false);
                        return;
                    }
                    onMessageAddListener();
                    resolve(true);
                } else {
                    Extension.isConnection = false;
                    showNoConnected();
                    resolve(false);
                }
            });
        });
    },
    windowName: windowName(),
    isConnection: undefined
};

chrome.runtime.onMessage.addListener( // background, content-script
    (request, sender, sendResponse) => {
        if (request.onload) {
            if (port.isConnection == false) {
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
            if (Extension.windowName == "extension") {
                if (request.options.isShowWhatNew) {
                    checkNew();
                }
            }
        }
        if (request.event == "change_track") {
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
                setTimeout(() => {
                    getYandexMusicTab().then(tabId => {
                        if (tabId == false) {
                            sendEventBackground({ isConnected: false })
                            window.close();
                        }
                    });
                }, 500);
                break;
        }
    });

btnYes.onclick = () => {
    getYandexMusicTab().then(tabId => { openNewTab(tabId); });
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
};

pause[0].onclick = () => {
    sendEvent("togglePause");
};

next[0].onclick = () => {
    sendEvent("next");
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

modal[0].onclick = function () {
    let removeClass = () => {
        modal[0].classList.remove("modal-background-reverse");
        modal[0].removeEventListener("animationend", removeClass);
        modal[0].style.display = "none";
    }
    modal[0].addEventListener("animationend", removeClass);
    modal[0].classList.add("modal-background-reverse");
    openCoverAnimate(CoverAnimation.element, true);
}

closeNotification.onclick = function () {
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