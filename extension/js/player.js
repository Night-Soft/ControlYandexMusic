let playlist = document.getElementById("listTrack");
let tracksListTitle = document.getElementsByClassName("title-list")[0];
let listTracks = document.getElementsByClassName("list-track")[0];
let loadingBar = document.getElementsByClassName("loading-bar")[0];
let toggleShuffle = document.querySelector(".toggle-shuffle");
let toggleRepeat = document.querySelector(".toggle-repeat");
let toggleVolume = document.getElementsByClassName("toggle-volume")[0];
let contentGrooveVolume = document.getElementsByClassName("content-groove-volume")[0];
let trackPositionTop;
let trackPositionBottom;
let previousSelectItem;
let previousSlider;
let selectedItem;
let likeItem;
let isFirstScroll = false;
let likeItems = [];
let itemTracks = [];

const PlayerInfo = class {
    constructor() {
        let volume = 0.5;
        let speed = 1;
        let duration = 0;
        let position = 0;
        let loaded = 0;
        let isPlay;
        let isRepeat;
        let isShuffle;
        Object.defineProperties(this, {
            duration: {
                get() { return duration; },
                set(value) {
                    if (Number.isFinite(value)) {
                        duration = value;
                        sliderProgress.maxScale = value;
                        durationSpan.innerHTML = getDurationAsString(value);
                    }
                },
                enumerable: true
            },
            position: {
                get() { return position; },
                set(value) {
                    if (Number.isFinite(value)) {
                        value = Number.parseFloat(value.toFixed(6));
                        if (value < 0) {
                            value = 0
                        } else if (value > duration) {
                            value = duration;
                        }
                        position = value;
                        this.#currentTime = Date.now();
                        currentTime.innerHTML = getDurationAsString(value);
                        sliderProgress.setPosition(value);
                        if (isPlay == true && this.isUpdateTimer == false && value > 0) {
                            this.#positionUpdater();
                        }
                    }
                },
                enumerable: true
            },
            loaded: {
                get() { return loaded; },
                set(value) {
                    if (Number.isFinite(value)) {
                        loaded = value;
                        loadingBar.style.width = (value * 100 / duration) + "%";
                    }
                },
                enumerable: true
            },
            speed: {
                get() { return speed; },
                set(value) {
                    if (Number.isFinite(value)) {
                        speed = value;
                    }
                },
                enumerable: true
            },
            volume: {
                get() { return volume; },
                set(value) {
                    if (Number.isFinite(value)) {
                        volume = value;
                        setVolume(value);
                    }
                },
                enumerable: true
            },
            isPlay: {
                get() { return isPlay; },
                set(value) {
                    if (typeof value === "boolean") {
                        if (value !== isPlay) {
                            isPlay = value;
                            setPlaybackStateStyle(value);
                            this.#positionUpdater();
                        }
                    } else {
                        isPlay = false;
                        this.stopUpdater();
                        setPlaybackStateStyle(false);
                    }
                },
                enumerable: true
            },
            isRepeat: {
                get() { return isRepeat; },
                set(value) {
                    if (value === isRepeat) return;
                    if (typeof value === 'boolean' || value === 1 || value === null) {
                        if (isRepeat === undefined || isRepeat === null) {
                            isRepeat = value;
                            updateRepeat(value, false);
                            return;
                        }
                        isRepeat = value;
                        updateRepeat(value, true);

                    }
                },
                enumerable: true
            },
            isShuffle: {
                get() { return isShuffle; },
                set(value) {
                    if (value === isShuffle) return;
                    if (typeof value === 'boolean' || value === null) {
                        if (isShuffle === undefined || isShuffle === null) {
                            isShuffle = value;
                            updateShuffle(value, false);
                            return;
                        }
                        isShuffle = value;
                        updateShuffle(value, true);

                    }
                },
                enumerable: true
            },
        });
    }
    info = {
        source: {},
        tracks: []
    }
    track;
    index; // Number
    disliked;
    likeItem;
    coverLink;
    coverItem;
    isAutoScroll = false;
    isUpdateTimer = false;
    #currentTime = 0;
    #positionUpdaterId = undefined;
    #positionUpdater() {
        this.stopUpdater();
        if (this.isPlay == false || this.position == 0) return;

        this.#currentTime = Date.now();
        const updateTimer = () => {
            if (Date.now() - this.#currentTime >= 500) {
                this.position += (Date.now() - this.#currentTime) / 1000 * this.speed;
                this.#currentTime = Date.now();
            }
            if (this.position >= this.duration) {
                this.stopUpdater();
                return;
            }
            if (this.position + 1 > this.loaded && this.position + 1 < this.duration && this.position > 0) {
                this.stopUpdater();
                toggleLoadingWaitingBarDelay.start(true);
                return;
            }
        }
        this.#positionUpdaterId = setInterval(updateTimer, 500);
        this.isUpdateTimer = true;
    }
    stopUpdater() {
        try {
            this.isUpdateTimer = false;
            clearInterval(this.#positionUpdaterId);
            if (toggleLoadingWaitingBarDelay.isStarted || toggleLoadingWaitingBarDelay.isShown) {
                toggleLoadingWaitingBarDelay.execute(false);
            }
        } catch (error) { console.log(error); }
    }
    /**
    * @param {object} progress - {duration, position, loaded}.
    */
    setProgress({ duration, position, loaded }) {
        if (duration >= 0) { this.duration = duration; }
        if (position >= 0) { this.position = position; }
        if (loaded >= 0) { this.loaded = loaded; }
    }
} 

const Player = new PlayerInfo();

let CurrentAnimation = {
    keyframe: undefined,
    options: undefined,
    left: undefined,
    top: undefined,
    isFromList: undefined
}

let updateTracksList = (trackInfo) => {
    Player.track = trackInfo.tracksList[trackInfo.index];
    Player.disliked = trackInfo.tracksList[trackInfo.index].disliked;
    Player.likeItem = likeItems[trackInfo.index];

    Player.info.source = trackInfo.sourceInfo;

    // remove null object from tracksList
    for (let i = trackInfo.tracksList.length; i >= 0; i--) {
        if (trackInfo.tracksList[i] == null) {
            trackInfo.tracksList.splice(i, 1);
        }
    }
    setTracksList(trackInfo.tracksList, trackInfo.index);
}

let setTitle = (title) => {
    if (title.title != undefined) {
        tracksListTitle.innerHTML = title.title;
    } else {
        tracksListTitle.innerHTML = title.type;
    }
}

let setTracksList = (list, index) => {
    try {
        if (index >= 0 && Player.index != index) {
            let allItem = document.querySelectorAll(".item-track");
            selectItem(allItem[index], index);
        }
        if (equals(list, Player.info.tracks)) { return; }
    } catch (error) {}
    Player.info.tracks = list;
    setTitle(Player.info.source);
    let allItem = document.querySelectorAll(".item-track");
    clearList(allItem);
    likeItems = [];
    try {
        trackPositionTop.remove();
        trackPositionBottom.remove();    
    } catch (error) {}
    createListElement(list, index);
    Player.likeItem = likeItems[index];
}

let createListElement = (list, index) => {
    let ifHour = false;
    for (let i = 0; i < list.length; i++) {
        let itemTrack = document.createElement("DIV");
        itemTrack.classList.add("item-track");

        let itemCover = document.createElement("DIV");
        itemCover.classList.add("item-cover");
        itemCover.setAttribute("loading", "lazy");
        itemCover.style.backgroundImage = "url(" + getUrl(list[i].cover) + ")";
        itemCover.onclick = (ev) => {
            Player.coverItem = itemCover;
            openCover(itemCover, list[i].cover, openCoverAnimate);
        }

        let contentItemName = document.createElement("DIV");
        contentItemName.classList.add("content-item-name");

        let itemNameTrack = document.createElement("DIV");
        itemNameTrack.classList.add("item-name-track");
        itemNameTrack.innerHTML = list[i].title;

        let itemArtists = document.createElement("DIV");
        itemArtists.classList.add("item-artists");
        itemArtists.innerHTML = getArtists(list[i]);

        contentItemName.appendChild(itemNameTrack);
        contentItemName.appendChild(itemArtists);
        let itemTrackContent = document.createElement("DIV");
        itemTrackContent.classList.add("item-track-content");

        itemTrackContent.appendChild(itemCover);
        itemTrackContent.appendChild(contentItemName);

        let listLike = document.createElement("DIV");
        if (list[i].liked) {
            listLike.classList.add("list-like");
        } else if (list[i].disliked) {
            listLike.classList.add("list-disliked");
            setDislikedStyle(itemTrack, true);
        }
        listLikeControl(listLike, list[i], i);
        likeItems.push(listLike);

        itemTrack.onmouseenter = (ev) => {
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            if (ev.target == itemTrack) {
                if (!list[i].liked && !list[i].disliked && Player.index == i) {
                    Player.likeItem = listLike;
                    Player.track = list[i];
                    listLike.classList.add("list-dislike");
                    listLike.style.animation = "show-like 1s normal";
                    Player.endShowLike = (ev) => {
                        listLike.style.animation = null;
                        listLike.removeEventListener("animationend", Player.endShowLike);
                    }
                    listLike.removeEventListener("animationend", Player.endShowLikeReverse);
                    listLike.addEventListener("animationend", Player.endShowLike);
                }
            }
        }

        itemTrack.onmouseleave = (ev) => {
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            if (ev.target == itemTrack) {
                if (!list[i].liked && !list[i].disliked && Player.index == i) {
                    Player.endShowLikeReverse = (ev) => {
                        listLike.classList.remove("list-dislike");
                        listLike.removeEventListener("animationend", Player.endShowLikeReverse);
                        listLike.style.animation = null;
                        contentItemName.style.maxWidth = "";
                    }
                    listLike.removeEventListener("animationend", Player.endShowLike);
                    listLike.addEventListener("animationend", Player.endShowLikeReverse);
                    listLike.style.animation = "show-like 1s reverse";
                }
            }
        }

        itemTrack.onclick = (ev) => {
            if (ev.target != listLike && ev.target != itemCover) {
                if (Player.index == i) {
                    sendEvent("togglePause");
                } else {
                    sendEvent({ play: i }, true); // send as object
                    Player.stopUpdater();
                    if (!Player.info.tracks[i].liked && !list[i].disliked) {
                        listLike.classList.add("list-dislike");
                        listLike.style.animation = "show-like 1s normal";
                        let endShowLike = (ev) => {
                            listLike.style.animation = null;
                            listLike.removeEventListener("animationend", endShowLike);
                        }
                        listLike.addEventListener("animationend", endShowLike);

                    }
                }
            }
        }
        itemTrack.appendChild(listLike);

        let trackTime = document.createElement("span");
        trackTime.classList.add("track-time");
        trackTime.innerHTML = getDurationAsString(list[i].duration);
        itemTrack.appendChild(trackTime);

        if (index != undefined && index == i) {
            selectItem(itemTrack, index);
        }
        if (list[i].duration > 3600 && ifHour == false) {
            let rootCss = document.querySelector(':root');
            rootCss.style.setProperty('--ifHour', 'calc(100% - 100px)');
        }

        itemTrack.prepend(itemTrackContent);
        listTracks.appendChild(itemTrack);
    }

    trackPositionTop = document.createElement('div');
    trackPositionTop.classList.add("track-position-top");
    trackPositionBottom = document.createElement('div');
    trackPositionBottom.classList.add("track-position-bottom");

    let listTrack = document.getElementById("listTrack");
    trackPositionTop.onclick = () => {
        selectedItem.scrollIntoView({ block: "center", behavior: "smooth" });
    
    }
    trackPositionBottom.onclick = () => {
        selectedItem.scrollIntoView({ block: "center", behavior: "smooth" });
    
    }
    listTracks.prepend(trackPositionBottom);
    listTracks.prepend(trackPositionTop);
    listTrack.onscroll = function (event) {
        checkTrackPosition();
    };
}

document.body.onmouseenter = () => { Player.isAutoScroll = false; }
document.body.onmouseleave = () => { Player.isAutoScroll = true; }

let listLikeControl = (listLike, list, index) => {
    listLike.onclick = () => {
        if (Player.index == index) {
            if (Player.disliked) {
                Player.likeFromPlaylist = true;
                Player.likeItem = listLike;
                Player.track = list;
                sendEvent("toggleDislike");
                return;
            }
            Player.likeFromPlaylist = true;
            Player.likeItem = listLike;
            Player.track = list;
            sendEvent("toggleLike");
        }
    }
    listLike.onlongpress = () => {
        console.log("onlongpress");
        if (Player.index == index) {
            Player.likeFromPlaylist = true;
            Player.likeItem = listLike;
            Player.track = list;
            sendEvent("toggleDislike");
        }

    }
}

// call from extension.js
let toggleListLike = (isLike) => {
    let contentItemName = document.querySelectorAll(".content-item-name")[Player.index];
    if (isLike) {
        Player.track.liked = isLike;
        Player.likeItem.classList.remove("list-dislike");
        Player.likeItem.classList.add("list-like");
        contentItemName.style.maxWidth = contentItemName.innerWidth - 35 + "px";
    } else {
        Player.track.liked = isLike;
        Player.likeItem.classList.remove("list-like");
        if (Player.likeFromPlaylist == true) {
            Player.likeItem.classList.add("list-dislike");
            Player.likeFromPlaylist = false;
        } else {
            contentItemName.style.maxWidth = "";
        }
    }

}

let setDislikedStyle = (item, isDisliked) => {
    if (isDisliked) {
        item.style.filter = "opacity(0.5)";
    } else {
        item.style.filter = "";
    }
}

let toggleListDisliked = (isDisliked) => {
    let contentItemName = document.querySelectorAll(".content-item-name")[Player.index];
    if (isDisliked) {
        Player.track.disliked = isDisliked;
        Player.likeItem.classList.remove("list-dislike");
        Player.likeItem.classList.remove("list-like");
        Player.likeItem.classList.add("list-disliked");
        contentItemName.style.maxWidth = contentItemName.innerWidth - 35 + "px";
        setDislikedStyle(selectedItem, isDisliked);
        contentItemName.style.maxWidth = contentItemName.innerWidth - 35 + "px";
    } else {
        Player.track.disliked = isDisliked;
        Player.likeItem.classList.remove("list-like");
        Player.likeItem.classList.remove("list-disliked");
        setDislikedStyle(selectedItem, isDisliked);
        if (Player.likeFromPlaylist == true) {
            Player.likeItem.classList.add("list-dislike");
            Player.likeFromPlaylist = false;
        } else {
            contentItemName.style.maxWidth = "";
        }
    }
}

const equals = (a, b) => {
    for (let i = 0; i < a.length; i++) {
        if (a[i].title != b[i].title) {
            return false;
        }
    }
    return true;
};

let getArtists = (list, numberOf = 3) => {
    let getArtistsTitle = (listArtists) => {
        let artists = "";
        for (let i = 0; i < numberOf; i++) {
            if (listArtists[i] == undefined && i != 0) {
                artists = artists.slice(0, -2);
                return artists;
            }
            artists += listArtists[i].title + "," + " ";
        }
        artists = artists.slice(0, -2);
        return artists;
    }
    if (list.artists.length > 0) {
        return getArtistsTitle(list.artists);
    } else {
        // get from posdcast
        if (list.album.hasOwnProperty("title")) {
            return list.album.title;
        }
        return "";
    }
}

let selectItem = (item, index) => {
    if (previousSelectItem != undefined) {
        previousSelectItem.classList.remove("selected-item");
    }
    item.classList.add("selected-item");
    previousSelectItem = item;
    selectedItem = item;
    Player.index = index;
    let getSelectedItem = document.getElementsByClassName("selected-item")[0];
    if (getSelectedItem) { // the selectedItem did not fully rendered
        checkTrackPosition();
    }
    if (Player.isAutoScroll) {
        selectedItem.scrollIntoView({ block: "center", behavior: "smooth" });
    }
}

let isTrackPosition = false;
let showTrackPosition = new ExecutionDelay(
    (position) => {
        if (isTrackPosition) {
            let = keyframe = {
                opacity: [0, 1]
            };
            if (position === "top") {
                trackPositionTop.style.display = "block";
                trackPositionBottom.style.display = "none";
                trackPositionTop.animate(keyframe, { duration: 700 });
            } else if (position === "bottom") {
                trackPositionTop.style.display = "none";
                trackPositionBottom.style.display = "block";
                trackPositionBottom.animate(keyframe, { duration: 700 });
            }
        }

    }, { delay: 200 }
);

let checkTrackPosition = (from) => {
    let { height, top } = selectedItem.getClientRects()[0];
    let playlistTop = playlist.getClientRects()[0].top - height;

    if (playlistTop > top) {
        if (isTrackPosition == false) {
            isTrackPosition = true;
            showTrackPosition.start("top");
        }
        return;
    } else if (top > innerHeight) {
        if (isTrackPosition == false) {
            isTrackPosition = true;
            showTrackPosition.start("bottom");
        }
        return;
    }
    // remove track position
    if (isTrackPosition == false) { return; }
    isTrackPosition = false;
    showTrackPosition.stop();
    let = keyframe = {
        opacity: [1, 0]
    };
    trackPositionBottom.animate(keyframe, { duration: 700 }).onfinish = () => {
        if (isTrackPosition == false) {
            trackPositionBottom.style.display = "none";
        }
    };
    trackPositionTop.animate(keyframe, { duration: 700 }).onfinish = () => {
        if (isTrackPosition == false) {
            trackPositionTop.style.display = "none";
        }
    };
}

let scrollToSelected = () => {
    if (!isFirstScroll) {
        if (Player.info.tracks.length > 0) {
            selectedItem.scrollIntoView({ block: "center", behavior: "smooth" });
        }
        isFirstScroll = true;
    }
}

let clearList = (list) => {
    for (let i = 0; i < list.length; i++) {
        list[i].remove();
    }
}

/**
 * @param {number} volume min 0 max 1.
 */
let setVolume = (volume) => {
    volume = volume * 100;
    let isVolume;
    if (sliderVolumeContent.offsetWidth == 0) {
        sliderVolumeContent.style.display = "block"; // for slider can get offset
        isVolume = false;
    }
    sliderVolume.setPosition(volume);
    if (volume >= 50) {
        toggleVolume.style.webkitMaskImage = "url(img/volume-max.svg)";
    } else if (volume < 50 && volume != 0) {
        toggleVolume.style.webkitMaskImage = "url(img/volume-middle.svg)";
    }
    if (volume <= 0) {
        toggleVolume.style.webkitMaskImage = "url(img/volume-mute.svg)";
    }
    if (isVolume == false) {
        sliderVolumeContent.style.display = "none";
    }
}

let updateRepeat = (repeat, isUpdate = false) => {
    if (repeat === null) {
        toggleRepeat.style.display = "none";
        return;
    }
    if (toggleRepeat.style.display == "none") { toggleRepeat.style.display = ""; }
    if (repeat === true) {
        if (isUpdate) showNotification(chrome.i18n.getMessage("playListRepeatOn"), 5000);
        if (toggleRepeat.classList.contains('toggle-active') == false) {
            toggleRepeat.classList.add('toggle-active');
        }
        toggleRepeat.style.webkitMaskImage = "url(img/repeat.svg)"
        toggleRepeat.style.opacity = "1";
    } else if (repeat === false) {
        if (isUpdate) showNotification(chrome.i18n.getMessage("repeatOf"), 5000);
        if (toggleRepeat.classList.contains('toggle-active')) {
            toggleRepeat.classList.remove('toggle-active');
        }
        toggleRepeat.style.webkitMaskImage = "url(img/repeat.svg)"
        toggleRepeat.style.opacity = "";
    }
    if (repeat === 1) {
        if (isUpdate) showNotification(chrome.i18n.getMessage("repeatOn"), 5000);
        if (toggleRepeat.classList.contains('toggle-active') == false) {
            toggleRepeat.classList.add('toggle-active');
        }
        toggleRepeat.style.webkitMaskImage = "url(img/repeat-one.svg)";
        toggleRepeat.style.opacity = "1";
    }
}

let updateShuffle = (shuffle, isUpdate = false) => {
    if (shuffle === null) {
        toggleShuffle.style.display = "none";
        return;
    }
    if (toggleShuffle.style.display == "none") { toggleShuffle.style.display = ""; }
    if (shuffle === true) {
        if (isUpdate) showNotification(chrome.i18n.getMessage("randomOrder"), 6000);
        if (toggleShuffle.classList.contains('toggle-active') == false) {
            toggleShuffle.classList.add('toggle-active');
        }
        toggleShuffle.style.opacity = "1";
    } else {
        if (isUpdate) showNotification(chrome.i18n.getMessage("playbackRow"), 6000);
        if (toggleShuffle.classList.contains('toggle-active')) {
            toggleShuffle.classList.remove('toggle-active');
        }
        toggleShuffle.style.opacity = "";
    }
}

toggleShuffle.onclick = (event) => {
    sendEvent({ toggleShuffle: true }, true);
}
toggleRepeat.onclick = (event) => {
    sendEvent({ toggleRepeat: true }, true);

}
toggleVolume.onclick = (event) => {
    sendEvent({ toggleVolume: true }, true);

}

toggleVolume.onwheel = (event) => {
    sliderVolume.showTooltip(true);
    if (event.deltaY < 0) {
        if (sliderVolume.scale <= sliderVolume.maxScale) {
            sliderVolume.scale += 4;
            if (sliderVolume.scale > sliderVolume.maxScale) sliderVolume.scale = sliderVolume.maxScale;
            sliderVolume.setTooltipPosition(sliderVolume.scale);
            sendEvent({ setVolume: sliderVolume.scale / 100 }, true);
        }
    } else {
        if (sliderVolume.scale >= 0) {
            sliderVolume.scale -= 4;
            if (sliderVolume.scale < 0) sliderVolume.scale = 0;
            sliderVolume.setTooltipPosition(sliderVolume.scale);
            sendEvent({ setVolume: sliderVolume.scale / 100 }, true);
        }
    }
}

let isVolume = false;
const showVolumeDelay = new ExecutionDelay(() => {
    sliderVolumeContent.style.display = "block";
    isVolume = true;
    let keyframe = {
        opacity: [0, 1]
    };

    let options = {
        duration: 300,
    }
    sliderVolumeContent.animate(keyframe, options);
}, {
    delay: 150,
    isThrottling: true
});

const hideVolumeDelay = new ExecutionDelay(() => {
    isVolume = false;
    let keyframe = {
        opacity: [1, 0]
    };
    let options = {
        duration: 300,
    }
    sliderVolumeContent.animate(keyframe, options).onfinish = () => {
        sliderVolumeContent.style.display = "none";
    };
}, {
    delay: 850,
    isThrottling: true
});

toggleVolume.onmouseenter = () => {
    if (isVolume == false) { showVolumeDelay.start(); }
    if (hideVolumeDelay.isStarted) { hideVolumeDelay.stop(); }
}

contentGrooveVolume.onmouseenter = () => {
    if (hideVolumeDelay.isStarted) { hideVolumeDelay.stop(); }
 }
contentGrooveVolume.onmouseleave = (event) => {
    if(event.toElement == null) return;
    if (showVolumeDelay.isStarted) { showVolumeDelay.stop(); }
    if (isVolume) { hideVolumeDelay.start(); }
}