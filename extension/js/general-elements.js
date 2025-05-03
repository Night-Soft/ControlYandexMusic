let previous = document.getElementById("Previous");
let pause = document.getElementById("Pause");
let next = document.getElementById("Next");
let trackImage = document.getElementsByClassName("cover");
let artistsName = document.getElementsByClassName("name-artists");
let trackName = document.getElementsByClassName("name-track");
let modal = document.getElementsByClassName("modal");
let modalCover = document.getElementsByClassName("modal-cover");
let like = document.getElementsByClassName("like");
let btnYes = document.getElementById("Yes");
let btnNew = document.getElementById("New");
let appDetected = document.getElementById("AppDetected");
let appQuestion = document.getElementById("AppQuestion");
let noConnect = document.getElementsByClassName("no-connect")[0];
let loaderContainer = document.getElementsByClassName("loader-container")[0];
let yesNoNew = document.getElementsByClassName("yes-no-new")[0];
let transition = document.getElementsByClassName("transition");
let hamburgerMenuList = document.getElementsByClassName("hamburger-menu-list")[0];
let dislike = document.getElementsByClassName("dislike")[0];
let notificationTrackName = document.getElementsByClassName("notification-track-name")[0];
let contentListMenu = document.getElementsByClassName("content-list-menu")[0];
let modalListMenu = document.getElementsByClassName("modal-list-menu")[0];
let PlayIcon = document.getElementsByClassName("svg-play")[0];
let PauseIcon = document.getElementsByClassName("svg-pause")[0];

const rewind = rewindHolding();

let port = { isConnection: false };

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
                    showNoConnected();
                    resolve(false);
                }
            });
        });
    },
    windowName: windowName(),
};

chrome.runtime.onMessage.addListener( // background, content-script
    (request, sender, sendResponse) => {
        if (request.getId) {
            Player.playlist.clear();
            Player.info = { source: {}, tracks: [] }
            Player.setProgress({ loaded: 0, duration: 0, position: 0 });
            artistsName[0].innerText = "Artists";
            trackName[0].innerText = "Track";
            trackImage[0].style.backgroundImage = "";
            requestAnimationFrame(() => {
                requestIdleCallback(()=>{ // stop timer in 'scroll' event, in listtrack
                    checkTrackPosition.stop();
                    checkForNewElement.stop();
                });
            });
        }
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
            if (request.writeOptions) {
                setOptions(request.options, true);
            } else {
                setOptions(request.options);
            }
        }
        if (request.savePopupBounds && Extension.windowName === "extension") {
            setOptions({ popupBounds: request.savePopupBounds });
        } 
        if (request.popupCreated && Extension.windowName === "extension") {
            toggleSetCurrentSizeBtn();
        } 
        if (request.popupClosed && Extension.windowName === "extension") {
            toggleSetCurrentSizeBtn();
        } 
    });

chrome.runtime.onMessageExternal.addListener( // injected script
    (request, sender, sendResponse) => {
        switch (request.event) {
            case 'currentTrack': 
                if (request.trackInfo.index == -1) {
                    showNotification(chrome.i18n.getMessage("playlistEmpty"), 7000);
                    return;
                }
                updateTracksList(request.trackInfo);

                setMediaData(request.currentTrack.title, getArtists(request.currentTrack, 5), request.currentTrack.cover);
                toggleLike(request.currentTrack.liked, false);
                toggleDislike(request.currentTrack.disliked, false, false);

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
                break;
            case 'togglePause':
                Player.isPlay = request.isPlaying;
                break;
            case 'toggleLike':
                Player.liked = request.isLiked;
                break;
            case 'toggleDislike':
                Player.disliked = request.disliked.disliked;
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
                Player.disliked = request.disliked;
                Player.liked = request.liked;
                break;
            case "VOLUME":
                Player.volume = request.volume;
                break;
            case "SPEED":
                Player.speed = request.speed;
                Player.setProgress(request.progress);
                break;
            case "PROGRESS":
                if (request.progress.duration === 0) {
                    request.progress.duration = Player.track.duration;
                }
                Player.setProgress(request.progress);
                break;
            case "change_track":
                Player.stopUpdater();
                Player.setProgress({ position: 0, loaded: 0 });
                break;
            case "play_error":
                Player.isPlay = request.isPlaying;
                Player.setProgress(request.progress);
                break;
            case "uploadTracksMeta":
                Player.updateCanUploadTracks();
                break;
        }
    });

btnYes.onclick = () => {
    getYandexMusicTab().then(tabId => openNewTab(tabId));
}

btnNew.onclick = openNewTab;

previous.onclick = ()=>{
    if (Player.info.source.type === "radio") {
        sendEvent({ play: Player.index > 0 ? Player.index - 1 : 0 }, true);
        return;
    }
    sendEvent("previous");
};
previous.longpress = rewind.start.bind(null, -1.5);
previous.longpress.onend = rewind.stop;

next.onclick = sendEvent.bind(null, "next", undefined);
next.longpress = rewind.start.bind(null, 1.5);
next.longpress.onend = rewind.stop;

pause.onclick = sendEvent.bind(null, "togglePause", undefined);
like[0].onclick = sendEvent.bind(null, "toggleLike", undefined);
like[0].longpress = sendEvent.bind(null, "toggleDislike", undefined);
dislike.longpress = sendEvent.bind(null, "toggleDislike", undefined);
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

document.querySelector("#checkboxOpenCurTab").onclick = function () {
    writeOptions({ isOpenInCurrentTab: this.checked }, true);
}


const progress = document.querySelector(".progress");
const progressContent = document.querySelector(".progress-content");
const content = document.querySelector(".content");
const controlsContainer = document.querySelector(".controls-container");

let isProgressShoved = false;
const showProgressDelay = new ExecutionDelay((event) => {
    if (isProgressShoved) return;
    isProgressShoved = true;

    if (hideProgressDelay.isStarted) {
        const lastHide = hideProgressDelay.getFunction().arguments[0].timeStamp;
        const lastShow = event.timeStamp;
        if (lastShow < lastHide) return;
        hideProgressDelay.stop();
    }
    controlsContainer.style.overflow = "";
    progress.style.transition = "400ms";
    progress.style.opacity = "0";
    progressContent.style.opacity = "1";
    progressContent.style.transform = "translateY(0px)";
    content.style.transform = "translateY(0px)";
}, { delay: 150, isThrottle: true });

controlsContainer.onmouseenter = showProgressDelay.start;

const hideProgressDelay = new ExecutionDelay((event) => {
    if (!isProgressShoved) return;
    isProgressShoved = false;
    
    if (showProgressDelay.isStarted) {
        const lastShow = showProgressDelay.getFunction().arguments[0].timeStamp;
        const lastHide = event.timeStamp;
        if (lastShow > lastHide) return;
        showProgressDelay.stop();
    };
    controlsContainer.style.overflow = "hidden";
    progress.style.transition = "";
    progress.style.opacity = "1";
    progressContent.style.opacity = "0";
    progressContent.style.transform = "";
    content.style.transform = "";

}, { delay: 1250, isThrottle: true });

controlsContainer.onmouseleave = hideProgressDelay.start;