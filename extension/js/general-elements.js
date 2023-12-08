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

                Player.isPlay = request.isPlaying;
                Player.volume = request.volume;
                Player.isRepeat = request.controls.repeat;
                Player.isShuffle = request.controls.shuffle;

                if (request.progress.duration > 0) {
                    Player.setProgress(request.progress);
                } else {
                    Player.stopUpdater();
                    Player.setProgress({
                        position: 0,
                        loaded: 0,
                        duration: request.currentTrack.duration
                    });
                }

                updateTracksList(request.trackInfo);
                break;
            case 'togglePause':
                Player.isPlay = request.isPlaying;
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
                Player.disliked = request.disliked.disliked;
                if (Player.disliked) {
                    toggleLike(false);
                }
                toggleDislike(request.disliked.disliked, true);
                toggleListDisliked(request.disliked.disliked);
                break;
            case "TRACKS_LIST":
                updateTracksList(request);
                break;
            case "STATE":
                Player.isPlay = request.isPlaying;
                Player.position = request.progress.position;
                break;
            case "CONTROLS":
                Player.isRepeat = request.repeat;
                Player.isShuffle = request.shuffle;
                break;
            case "VOLUME":
                Player.volume = request.volume;
                break;
            case "SPEED":
                Player.speed = request.speed;
                Player.setProgress(request.progress);
                break;
            case "PROGRESS":
                Player.setProgress(request.progress);
                break;
            case "change_track":
                Player.stopUpdater();
                Player.setProgress({ position: 0, loaded: 0 });
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
    getYandexMusicTab().then(tabId => openNewTab(tabId));
}

bntNo.onclick = () => {
    noConnect.classList.add("puff-out-center");
    noConnect.addEventListener("animationend", () => {
        noConnect.style.display = "none";

    });
}

btnNew.onclick = openNewTab;

previous[0].onclick = sendEvent.bind(null, "previous", undefined);
pause[0].onclick = sendEvent.bind(null, "togglePause", undefined);
next[0].onclick = sendEvent.bind(null, "next", undefined);
like[0].onclick = sendEvent.bind(null, "toggleLike", undefined);
like[0].onlongpress = sendEvent.bind(null, "toggleDislike", undefined);
dislike.onlongpress = sendEvent.bind(null, "toggleDislike", undefined);
dislike.onclick = sendEvent.bind(null, "toggleDislike", undefined);

trackImage[0].onclick = () => {
    let removeClass = () => {
        modal[0].classList.remove("modal-background");
        modalCover[0].removeEventListener("animationend", removeClass);
    }
    modalCover[0].addEventListener("animationend", removeClass);
    modal[0].classList.add("modal-background");
    if (urlCover == "img/icon.png") {
        openCover(trackImage[0]);
        return;
    }
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