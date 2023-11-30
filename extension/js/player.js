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

const PlayerInfo = {
    source: {},
    tracks: []
}

let State = { // current
    track: undefined,
    index: undefined, // Number
    disliked: undefined,
    likeItem: undefined,
    coverLink: undefined,
    coverItem: undefined,
    isAutoScroll: false,
    _volume: 0.5,
    _speed: 1,
    _duration: 0,
    _position: 0,
    _loaded: 0,
    _isPlay: undefined,
    _isRepeat: undefined,
    _isShuffle: undefined,
    
    get duration() { return this._duration; },
    set duration(value) {
        if (Number.isFinite(value)) {
            this._duration = value;
            sliderProgress.maxScale = value;
            durationSpan.innerHTML = getDurationAsString(value);
        }
    },

    get position() { return this._position; },
    set position(value) {
        if (Number.isFinite(value)) {
            value = Number.parseFloat(value.toFixed(6));
            if (value < 0) { 
                value = 0 
            } else if (value > this._duration) {
                value = this._duration;
            }
            this._position = value;
            this._currentTime = Date.now();
            currentTime.innerHTML = getDurationAsString(value);
            sliderProgress.setPosition(value);
            if (this._isPlay == true && this.isUpdateTimer == false && value > 0) {
                this._positionUpdater();
            }
        }
    },

    get loaded() { return this._loaded; },
    set loaded(value) {
        if (Number.isFinite(value)) {
            this._loaded = value;
            loadingBar.style.width = (value * 100 / this._duration) + "%";
        }
    },

    get speed() { return this._speed; },
    set speed(value) {
        if (Number.isFinite(value)) {
            this._speed = value;
        }
    },

    get volume() { return this._volume; },
    set volume(value) {
        if (Number.isFinite(value)) {
            this._volume = value;
            setVolume(value);
        }
    },

    get isPlay() { return this._isPlay; },
    set isPlay(value) {
        if (typeof value === "boolean") {
            if (value !== this._isPlay) {
                this._isPlay = value;
                setPlaybackStateStyle(value);
                this._positionUpdater();
            }
        } else {
            this._isPlay = false;
            this.stopUpdater();
            setPlaybackStateStyle(false);
        }
    },

    get isRepeat() { return this._isRepeat; },
    set isRepeat(value) {
        if (typeof value === 'boolean' || value === 1) {
            if (value !== this._isRepeat) {
                if (this._isRepeat == undefined) {
                    this._isRepeat = value;
                    updateRepeat(value, false);
                    return;
                }
                this._isRepeat = value;
                updateRepeat(value, true);
            }
        }
    },
    get isShuffle() { return this._isShuffle; },
    set isShuffle(value) {
        if (typeof value === 'boolean') {
            if (value !== this._isShuffle) {
                if (this._isShuffle == undefined) {
                    this._isShuffle = value;
                    updateShuffle(value, false);
                    return;
                }
                this._isShuffle = value;
                updateShuffle(value, true);
            }
        }
    },

    /**
    * @param {object} progress - {duration, position, loaded}.
    */
    setProgress(progress){
        if (typeof progress !== 'object') { return; }
        this.duration = progress.duration;
        this.position = progress.position;
        this.loaded = progress.loaded;
    },

    isUpdateTimer: false,
    _currentTime: 0,
    _positionUpdaterId: undefined,
    _positionUpdater() {
        this.stopUpdater();
        if (this._isPlay == false || this._position == 0) return;

        this._currentTime = Date.now();
        const updateTimer = () => {
            if (Date.now() - this._currentTime >= 500) {
                this.position += (Date.now() - this._currentTime) / 1000 * this._speed;
                this._currentTime = Date.now();
            }
            if (this._position >= this._duration) {
                this.stopUpdater();
                return;
            }
            if (this._position + 1 > this._loaded && this._position > 1) {
                this.stopUpdater();
                toggleLoadingWaitingBarDelay.start(true);
                return;
            }
        } 
        this._positionUpdaterId = setInterval(updateTimer, 500);
        this.isUpdateTimer = true;
    },
    stopUpdater() {
        try {
            this.isUpdateTimer = false;
            clearInterval(this._positionUpdaterId);
            if (toggleLoadingWaitingBarDelay.isStarted || toggleLoadingWaitingBarDelay.isShown) {
                toggleLoadingWaitingBarDelay.execute(false);
            }
        } catch (error) { console.log(error); }
    }
}

let CurrentAnimation = {
    keyframe: undefined,
    options: undefined,
    left: undefined,
    top: undefined,
    isFromList: undefined
}

let updateTracksList = (trackInfo) => {
    State.track = trackInfo.tracksList[trackInfo.index];
    State.disliked = trackInfo.tracksList[trackInfo.index].disliked;
    State.likeItem = likeItems[trackInfo.index];

    PlayerInfo.source = trackInfo.sourceInfo;

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
        if (index >= 0 && State.index != index) {
            let allItem = document.querySelectorAll(".item-track");
            selectItem(allItem[index], index);
        }
        if (equals(list, PlayerInfo.tracks)) { return; }
    } catch (error) {}
    PlayerInfo.tracks = list;
    setTitle(PlayerInfo.source);
    let allItem = document.querySelectorAll(".item-track");
    clearList(allItem);
    likeItems = [];
    try {
        trackPositionTop.remove();
        trackPositionBottom.remove();    
    } catch (error) {}
    createListElement(list, index);
    State.likeItem = likeItems[index];
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
            State.coverItem = itemCover;
            openCover(itemCover, getUrl(list[i].cover, 400), openCoverAnimate);
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
                if (!list[i].liked && !list[i].disliked && State.index == i) {
                    State.likeItem = listLike;
                    State.track = list[i];
                    listLike.classList.add("list-dislike");
                    listLike.style.animation = "show-like 1s normal";
                    State.endShowLike = (ev) => {
                        listLike.style.animation = null;
                        listLike.removeEventListener("animationend", State.endShowLike);
                    }
                    listLike.removeEventListener("animationend", State.endShowLikeReverse);
                    listLike.addEventListener("animationend", State.endShowLike);
                }
            }
        }

        itemTrack.onmouseleave = (ev) => {
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            if (ev.target == itemTrack) {
                if (!list[i].liked && !list[i].disliked && State.index == i) {
                    State.endShowLikeReverse = (ev) => {
                        listLike.classList.remove("list-dislike");
                        listLike.removeEventListener("animationend", State.endShowLikeReverse);
                        listLike.style.animation = null;
                        contentItemName.style.maxWidth = "";
                    }
                    listLike.removeEventListener("animationend", State.endShowLike);
                    listLike.addEventListener("animationend", State.endShowLikeReverse);
                    listLike.style.animation = "show-like 1s reverse";
                }
            }
        }

        itemTrack.onclick = (ev) => {
            if (ev.target != listLike && ev.target != itemCover) {
                if (State.index == i) {
                    sendEvent("togglePause");
                } else {
                    sendEvent({ play: i }, true); // send as object
                    State.stopUpdater();
                    if (!PlayerInfo.tracks[i].liked && !list[i].disliked) {
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

document.body.onmouseenter = () => { State.isAutoScroll = false; }
document.body.onmouseleave = () => { State.isAutoScroll = true; }

let listLikeControl = (listLike, list, index) => {
    listLike.onclick = () => {
        if (State.index == index) {
            if (State.disliked) {
                State.likeFromPlaylist = true;
                State.likeItem = listLike;
                State.track = list;
                sendEvent("toggleDislike");
                return;
            }
            State.likeFromPlaylist = true;
            State.likeItem = listLike;
            State.track = list;
            sendEvent("toggleLike");
        }
    }
    listLike.onLongPress = new LongPressButton(listLike, () => {
        if (State.index == index) {
            State.likeFromPlaylist = true;
            State.likeItem = listLike;
            State.track = list;
            sendEvent("toggleDislike");
        }

    });
}

// call from extension.js
let toggleListLike = (isLike) => {
    let contentItemName = document.querySelectorAll(".content-item-name")[State.index];
    if (isLike) {
        State.track.liked = isLike;
        State.likeItem.classList.remove("list-dislike");
        State.likeItem.classList.add("list-like");
        contentItemName.style.maxWidth = contentItemName.innerWidth - 35 + "px";
    } else {
        State.track.liked = isLike;
        State.likeItem.classList.remove("list-like");
        if (State.likeFromPlaylist == true) {
            State.likeItem.classList.add("list-dislike");
            State.likeFromPlaylist = false;
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
    let contentItemName = document.querySelectorAll(".content-item-name")[State.index];
    if (isDisliked) {
        State.track.disliked = isDisliked;
        State.likeItem.classList.remove("list-dislike");
        State.likeItem.classList.remove("list-like");
        State.likeItem.classList.add("list-disliked");
        contentItemName.style.maxWidth = contentItemName.innerWidth - 35 + "px";
        setDislikedStyle(selectedItem, isDisliked);
        contentItemName.style.maxWidth = contentItemName.innerWidth - 35 + "px";
    } else {
        State.track.disliked = isDisliked;
        State.likeItem.classList.remove("list-like");
        State.likeItem.classList.remove("list-disliked");
        setDislikedStyle(selectedItem, isDisliked);
        if (State.likeFromPlaylist == true) {
            State.likeItem.classList.add("list-dislike");
            State.likeFromPlaylist = false;
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
    try {
        if (State.track.liked == false) {
            State.likeItem.classList.remove("list-dislike");
        }
    } catch (error) {}
    if (previousSelectItem != undefined) {
        previousSelectItem.classList.remove("selected-item");
    }
    item.classList.add("selected-item");
    previousSelectItem = item;
    selectedItem = item;
    State.index = index;
    let getSelectedItem = document.getElementsByClassName("selected-item")[0];
    if (getSelectedItem) { // the selectedItem did not fully rendered
        checkTrackPosition();
    }
    if (State.isAutoScroll) {
        selectedItem.scrollIntoView({ block: "center", behavior: "smooth" });
    }
}

let trackPositionId;
let isTrackPosition = false;
let checkTrackPosition = (from) => {
    let top = selectedItem.getClientRects()[0].top;
    if (Extension.windowName != "extension") {
        top  = top - 120; // 120px top in popup
    }
    if (top < 0) {
        if (isTrackPosition == false) {
            clearTimeout(trackPositionId);
            isTrackPosition = true;
            trackPositionId = setTimeout(() => {
                if (isTrackPosition) {
                    let = keyframe = {
                        opacity: [0, 1]
                    };
                    trackPositionTop.style.display = "block";
                    trackPositionBottom.style.display = "none";
                    trackPositionTop.animate(keyframe, { duration: 700 })
                }


            }, 200);
        }
        return;
    }

    if (selectedItem.getClientRects()[0].top > innerHeight) {
        if (isTrackPosition == false) {
            clearTimeout(trackPositionId);

            isTrackPosition = true;
            trackPositionId = setTimeout(() => {
                if (isTrackPosition) {
                    let = keyframe = {
                        opacity: [0, 1]
                    };
                    trackPositionTop.style.display = "none";
                    trackPositionBottom.style.display = "block";
                    trackPositionBottom.animate(keyframe, { duration: 700 })
                }
            }, 200);
        }
        return;
    }
    // remove track position
    if (isTrackPosition == false) { return; }
    clearTimeout(trackPositionId);
    isTrackPosition = false;
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
        if (PlayerInfo.tracks.length > 0) {
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
    if (repeat == null) {
        toggleRepeat.style.display = "none";
        return;
    }
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
    if (shuffle == null) {
        toggleShuffle.style.display = "none";
        return;
    }
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