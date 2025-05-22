let listTracksContainer = document.getElementById("listTrack");
let listTracks = document.getElementsByClassName("list-track")[0];
let loadingBar = document.getElementsByClassName("loading-bar")[0];
let toggleShuffle = document.querySelector(".toggle-shuffle");
let toggleRepeat = document.querySelector(".toggle-repeat");
let toggleVolume = document.getElementsByClassName("toggle-volume")[0];
let contentGrooveVolume = document.getElementsByClassName("content-groove-volume")[0];
let trackPositionTop = document.querySelector(".track-position-top");
let trackPositionBottom = document.querySelector(".track-position-bottom");
let tracksListTitle = document.querySelector(".title-list");
let previousSelectItem;
let selectedItem;
let likeItem;

const PlayerInfo = class {
    constructor() {
        let volume = 0.5;
        let speed = 1;
        let duration = 0;
        let position = 0;
        let loaded = 0;
        let canUploadTracks = false;
        let canAddTracks = false;
        let isPlay;
        let isRepeat;
        let isShuffle;

        Object.defineProperties(this, {
            liked: {
                get() { return this.track.liked },
                set(value) {
                    if (typeof value !== "boolean" || value == this.track.liked) return;

                    this.track.liked = value;
                    if (value == true && this.track.disliked == true) {
                        this.track.disliked = false;
                        selectedItem.style.filter = "";
                        toggleDislike(false, true);
                    }

                    toggleLike(value);
                }
            },
            disliked: {
                get() { return this.track.disliked },
                set(value) {
                    if (typeof value !== "boolean" || value === this.track.disliked) return;

                    this.track.disliked = value;
                    if (value) {
                        this.track.liked = false;
                        toggleLike(false);
                    }

                    toggleDislike(value, true);
                }
            },
            duration: {
                get() { return duration; },
                set(value) {
                    if (Number.isFinite(value)) {
                        duration = value;
                        sliderProgress.maxScale = value;
                        durationSpan.innerText = getDurationAsString(value);
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
                        currentTime.innerText = getDurationAsString(value);
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
            canUploadTracks: {
                get() { return canUploadTracks; },
                set(value) {
                    if (typeof value === "boolean") {
                        canUploadTracks = value;
                    }
                },
                enumerable: true
            },
            canAddTracks: {
                get() { return canAddTracks; },
                set(value) {
                    if (typeof value === "boolean") {
                        canAddTracks = value;
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
            likeItem: {
                get() {
                    return this.playlist.elements.get(this.index)?.itemTrack.childNodes[1];
                }
            }
        });
    }
    info = {
        source: {},
        tracks: []
    }
    track = {
        liked: false,
        disliked: false
    }
    list = {
        tabTracks: new Map(),
        tracks: new Map()
    }
    playlist = new LivePlaylist();
    index; // Number
    coverLink;
    coverItem;
    isUpdateTimer = false;
    #currentTime = 0;
    #positionUpdaterId = undefined;
    #positionUpdater() {
        this.stopUpdater();
        if (this.isPlay == false || this.loaded == 0) return;

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
        this.isUpdateTimer = false;
        clearInterval(this.#positionUpdaterId);
        if (toggleLoadingWaitingBarDelay.isStarted || toggleLoadingWaitingBarDelay.isShown) {
            toggleLoadingWaitingBarDelay.execute(false);
        }
    }
    /**
    * @param {object} progress - {duration, position, loaded}.
    */
    setProgress({ loaded, duration, position }) {
        if (duration >= 0) { this.duration = duration; }
        if (loaded >= 0) { this.loaded = loaded; }
        if (position >= 0) { this.position = position; }
    }
    clearPlaylist(){
        this.list.tabTracks.clear();
        this.list.tracks.clear();
        this.playlist.clear();
    }
    updateCanUploadTracks() {
        this.canUploadTracks = this.info.tracks.some(track => track === null);
    }
    updateLikeDislike(tracksList) {
        const newLikes = [];
        Player.playlist.elements.forEach(({ itemTrack, tabIndex }) => { 
            const { liked: likedPrev, disliked: dislikedPrev } = Player.info.tracks[tabIndex];
            const { liked, disliked } = tracksList[tabIndex];
            if(likedPrev === liked && dislikedPrev === disliked) return;

            newLikes.push({ itemTrack, liked, disliked });
        });
        newLikes.forEach(({ itemTrack, liked, disliked }) => {
            toggleListLikes(itemTrack.children[1], liked, disliked);
        });
    }
} 

const Player = new PlayerInfo();
const playlist = Player.playlist;

let updateTracksList = ({ tracksList, sourceInfo, index: tabIndex }) => {
    Player.track = tracksList[tabIndex];
    Player.disliked = tracksList[tabIndex].disliked;

    if (compareSource(sourceInfo, tracksList)) {
        let indexInList = -1;
        tracksList.forEach((track, tabIndex) => {
            if (typeof track === "object" && track !== null) {
                indexInList++;
                const value = { index: indexInList, tabIndex, track };
                Player.list.tabTracks.set(tabIndex, value);
                Player.list.tracks.set(indexInList, value);
            }
        });

        Player.updateLikeDislike(tracksList);
        Player.info.tracks = tracksList;
        Player.updateCanUploadTracks();

        if (Player.canAddTracks) {
            Player.canAddTracks = false;
            checkForNewElement.execute();
        }

        addElementsIfNeeded(Player.list.tabTracks.get(tabIndex).index);
        return;
    }

    Player.info.tracks = tracksList;
    Player.info.source = sourceInfo;
    Player.clearPlaylist();

    if (isTrackPosition) {
        trackPositionBottom.style.display = "none";
        trackPositionTop.style.display = "none";
        isTrackPosition = false;
    }

    let index = -1;
    tracksList.forEach((track, tabIndex) => {
        if (typeof track === "object" && track !== null) {
            index++;
            const value = { index, tabIndex, track };
            Player.list.tabTracks.set(tabIndex, value);
            Player.list.tracks.set(index, value);
        }
    });

    Player.updateCanUploadTracks();
    updateTitle(Player.info.source);

    const numberOfElementsCreated = 60;
    const currentIndex = Player.list.tabTracks.get(tabIndex).index;
    const indexes = playlist.getIndexes(currentIndex, numberOfElementsCreated);

    addPlaylistElements(indexes, tabIndex);
}

let isFirstLoad = true;
let addPlaylistElements = (indexesForCreated, currentTabIndex) => {
    let isScrollTocenter = false;
    let isTimeGreaterThanOneHour = false;

    function predicate({ value: index }, itemTrack) {
        const likeItem = itemTrack.childNodes[1];
        const itemCover = itemTrack.childNodes[0].childNodes[0];
        const contentItemName = itemTrack.childNodes[0].childNodes[1];
        const { tabIndex, track } = Player.list.tracks.get(index);
        const coverCick = function() {
            Player.coverItem = this;
            openCover(this, track.cover);
        }
        const onmouseenter = (ev) => {
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            if (ev.target == itemTrack) {
                if (!track.liked && !track.disliked && Player.index == index) {
                    Player.track = track;
                    likeItem.classList.add("list-item-not-liked");
                    likeItem.style.animation = "show-like 1s normal";
                    Player.endShowLike = (ev) => {
                        likeItem.style.animation = null;
                        likeItem.removeEventListener("animationend", Player.endShowLike);
                    }
                    likeItem.removeEventListener("animationend", Player.endShowLikeReverse);
                    likeItem.addEventListener("animationend", Player.endShowLike);
                }
            }
        }

        const onmouseleave = (ev) => {
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            if (ev.target == itemTrack) {
                if (!track.liked && !track.disliked && Player.index == index) {
                    Player.endShowLikeReverse = (ev) => {
                        likeItem.classList.remove("list-item-not-liked");
                        likeItem.removeEventListener("animationend", Player.endShowLikeReverse);
                        likeItem.style.animation = null;
                        contentItemName.style.maxWidth = "";
                    }
                    likeItem.removeEventListener("animationend", Player.endShowLike);
                    likeItem.addEventListener("animationend", Player.endShowLikeReverse);
                    likeItem.style.animation = "show-like 1s reverse";
                }
            }
        }

        const onclick = (ev) => {
            if (ev.target != likeItem && ev.target != itemCover) {
                if (Player.index == index) {
                    sendEvent("togglePause");
                } else {
                    sendEvent({ play: tabIndex }, true); // send as object
                    Player.stopUpdater();
                    if (!Player.info.tracks[tabIndex].liked && !track.disliked) {
                        likeItem.classList.add("list-item-not-liked");
                        likeItem.style.animation = "show-like 1s normal";
                        let endShowLike = (ev) => {
                            likeItem.style.animation = null;
                            likeItem.removeEventListener("animationend", endShowLike);
                        }
                        likeItem.addEventListener("animationend", endShowLike);

                    }
                }
            }
        }

        const itemTrackAttr = {
            class: "item-track",
            onmouseenter,
            onmouseleave,
            onclick
        }
        if (track.disliked) itemTrackAttr.style = "filter: opacity(0.5)";
        let likeClass = "list-item-like ";
        likeClass += track.liked ? "list-item-liked" : track.disliked ? "list-item-disliked" : "";

        const imgAttr = {
            onclick: coverCick,
            class: "item-cover",
            loading: "lazy",
            src: getUrl(track.cover)
        }

        if (track.duration > 3600 && isTimeGreaterThanOneHour == false) {
            let rootCss = document.querySelector(':root');
            rootCss.style.setProperty('--ifHour', 'calc(100% - 100px)');
            isTimeGreaterThanOneHour = true;
        }

        listLikeControl(likeItem, track, index);

        return {
            itemTrackAttr,
            imgAttr,
            likeClass,
            onmouseenter,
            onmouseleave,
            onclick,
            track,
            artistsTitle: getArtists(track),
            duration: getDurationAsString(track.duration)
        }
    }

    const template = [
        ["div", "{{itemTrackAttr}}",
            ["div", { class: "item-track-content" },
                ["img", "{{imgAttr}}"],
                ["div", { class: "content-item-name" },
                    ["div", { class: "item-name-track" }, "{{track.title}}"],
                    ["div", { class: "item-artists",}, "{{artistsTitle}}"],
                ],
            ],
            ["div", { class: "{{likeClass}}" }], 
            ["span", { class: "track-time" }, "{{duration}}"]
        ]
    ];
    
    const itemTrack = new Component(template, indexesForCreated, predicate).nodes;
    indexesForCreated.forEach((indexVal, index) => {
        const { tabIndex, index: indexInList } = Player.list.tracks.get(indexVal); 
        const referenceElement = playlist.getReferenceElement(indexVal);

        listTracks.insertBefore(itemTrack[index], referenceElement); 

        
        playlist.elements.set(indexInList, {
            itemTrack: itemTrack[index], 
            index: indexInList,
            tabIndex
        });
        playlist.updateMinMaxIndex();

        if (currentTabIndex === tabIndex) {
            selectItem(itemTrack[index], indexInList);
            isScrollTocenter = true;
        }
    });

    if (isFirstLoad === false) {
        if(isScrollTocenter) scrollToCenter();
        return;
    }

    EventEmitter.on("playlistIsOpen", () => {
        function addScroll() {
            listTracks.addEventListener("scroll", checkTrackPosition.start);
            listTracks.addEventListener("scroll", checkForNewElement.start);
            listTracks.removeEventListener("scrollend", addScroll);
            clearTimeout(timeoutId);
            isFirstLoad = false;
        }

        let timeoutId = setTimeout(addScroll, 1500);

        listTracks.addEventListener("scrollend", addScroll);

        if (isScrollTocenter) scrollToCenter();
    }, true);

}

const compareTracksTitle = (newTracksList) => {
    const prevTracksList = Player.info.tracks;

    if (newTracksList.length !== prevTracksList.length) return false;

    for (let i = 0; i < newTracksList.length; i++) {
        if (newTracksList[i]?.title && prevTracksList[i]?.title) {
            if (newTracksList[i].title !== prevTracksList[i].title) return false;
        } else {
            /* true because the playlist can be the same,
            but one of the lists can contain more information about the tracks */
            if (i > 0) return true;
            return false;
        }
    }

    return true;
}

const compareSource = (sourceInfo, newTracksList) => {
    const prev = Player.info.source;

    if (sourceInfo.playlistId !== undefined) {
        if (sourceInfo.playlistId !== prev.playlistId) return false;
        return compareTracksTitle(newTracksList);
    }

    if (sourceInfo.link !== undefined && sourceInfo.type !== "radio") {
        return sourceInfo.link === prev.link;
    }

    if (sourceInfo.type === "radio") return compareTracksTitle(newTracksList);
}

const addElementsIfNeeded = (index) => {
    if (index >= 0 && Player.index != index) {
        if (!playlist.elements.get(index)) {
            let quantity = 10;
            let indexesForCreated;

            if (index < playlist.minIndex) {
                quantity = playlist.minIndex - index + 10;
                indexesForCreated = playlist.getIndexes(playlist.minIndex, quantity, "up");
            } else if (index > playlist.maxIndex) {
                quantity = index - playlist.maxIndex + 10;
                indexesForCreated = playlist.getIndexes(playlist.maxIndex, quantity, "down");
            } else {
                indexesForCreated = playlist.getIndexes(index, quantity, "center");
            }

            if (indexesForCreated) addPlaylistElements(indexesForCreated);
            return;
        }
        selectItem(playlist.elements.get(index).itemTrack, index);
    }
}

let updateTitle = (title) => {
    if (title.title != undefined) {
        tracksListTitle.innerText = title.title;
    } else {
        tracksListTitle.innerText = title.type;
    }
}

let listLikeControl = (likeItem, track, index) => {
    likeItem.onclick = () => {
        if (Player.index == index) {
            if (Player.disliked) {
                Player.likeFromPlaylist = true;
                Player.track = track;
                sendEvent("toggleDislike");
                return;
            }
            Player.likeFromPlaylist = true;
            Player.track = track;
            sendEvent("toggleLike");
        }
    }
    likeItem.longpress = () => {
        if (Player.index == index) {
            Player.likeFromPlaylist = true;
            Player.track = track;
            sendEvent("toggleDislike");
        }

    }
}

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
        previousSelectItem.childNodes[1].classList.remove("list-item-not-liked");
    }
    item.classList.add("selected-item");

    previousSelectItem = item;
    selectedItem = item;
    Player.index = index;
    
    if (!document.hasFocus() && !isFirstLoad) { 
        scrollToCenter();
        return;
    };
    if (EventEmitter.getEvent("playlistIsOpen")?.isEmitted) checkTrackPosition.execute();
}

let isTrackPosition = false;
let showTrackPosition = new ExecutionDelay(
    (position) => {
        if (isTrackPosition) {
            if (position === "top") {
                trackPositionTop.style.display = "block";
                trackPositionBottom.style.display = "none";
                trackPositionTop.animate({ opacity: [0, 1] }, { duration: 700 });
            } else if (position === "bottom") {
                trackPositionTop.style.display = "none";
                trackPositionBottom.style.display = "block";
                trackPositionBottom.animate({ opacity: [0, 1] }, { duration: 700 });
            }
        }

    }, { delay: 200 }
);

const checkTrackPosition = new ExecutionDelay(() => {
    const rect = selectedItem.getClientRects();
    if (rect.length === 0) return;

    let { height, top } = rect[0];
    let playlistTop = listTracksContainer.getClientRects()[0].top - height;

    if (playlistTop > top) {
        if (isTrackPosition === "top") return;
        isTrackPosition = "top";
        showTrackPosition.start("top");
        return;

    } else if (top > innerHeight) {
        if (isTrackPosition === "bottom") return;
        isTrackPosition = "bottom";
        showTrackPosition.start("bottom");
        return;
    }
    // remove track position
    if (isTrackPosition == false) return; 
    isTrackPosition = false;
    showTrackPosition.stop();

    let keyframe = { opacity: [1, 0] };
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
}, { delay: 500, isThrottle: true });

const checkUploadTracks = (direction) => {
    const listHeight = listTracks.getClientRects()[0].height;
    const height = playlist.firstElement.itemTrack.getClientRects()[0].height;

    const quantity = listHeight / height > 10 ? Math.floor(listHeight / height) : 10;
    const index = direction === "up" ? playlist.firstElement.index : playlist.lastElement.index;
    const indexes = playlist.getIndexes(index, quantity, direction);

    if (indexes) addPlaylistElements(indexes);
    if (indexes?.length >= 10) return;
    if (!Player.canUploadTracks) return;

    if (direction === "up") {
        const minIndex = Player.playlist.minIndex;
        if (minIndex - 10 >= 10) {
            Player.canUploadTracks = false;
            Player.canAddTracks = true;
            sendEvent({ uploadTracksMeta: direction }, true);
        }
    } else if (direction === "down") {
        const fullListSize = Player.info.tracks.length - 1;
        const tracksSize = Player.list.tracks.size - 1;
        const maxIndex = Player.playlist.maxIndex;
        if (tracksSize - maxIndex <= 10 && maxIndex < fullListSize) {
            Player.canUploadTracks = false;
            Player.canAddTracks = true;
            sendEvent({ uploadTracksMeta: direction }, true);
        }
    }
}

const checkForNewElement = new ExecutionDelay(() => {
    const {top, bottom} = listTracks.getClientRects()[0];
    const { top: firstElementY, height } = playlist.firstElement.itemTrack.getClientRects()[0];
    const lastElementY = playlist.lastElement.itemTrack.getClientRects()[0].top;
    const elementSize = height * 5; 

    if (firstElementY > -elementSize + top) checkUploadTracks("up");
    if (lastElementY < elementSize + bottom - height) checkUploadTracks("down");

}, { delay: 200, isThrottle: true });

const scrollToCenter = () => {
    selectedItem.scrollIntoView({ block: "center", behavior: "smooth" });
}

trackPositionTop.onclick = scrollToCenter;
trackPositionBottom.onclick = scrollToCenter;


/**
 * @param {number} volume min 0 max 1.
 */
let setVolume = (volume) => {
    volume = Math.round(volume * 100);
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

toggleShuffle.onclick = () => { sendEvent({ toggleShuffle: true }, true); }
toggleRepeat.onclick = () => { sendEvent({ toggleRepeat: true }, true); }
toggleVolume.onclick = () => { sendEvent({ toggleVolume: true }, true); }

toggleVolume.onwheel = (event) => {
    sliderVolume.showTooltip(true);
    if (event.deltaY < 0) {
        if (sliderVolume.scale <= sliderVolume.maxScale) {
            sliderVolume.scale += sliderVolume.wheelStep;
            if (sliderVolume.scale > sliderVolume.maxScale) sliderVolume.scale = sliderVolume.maxScale;
            sliderVolume.setTooltipPosition(sliderVolume.scale);
            sendEvent({ setVolume: sliderVolume.scale / 100 }, true);
        }
    } else {
        if (sliderVolume.scale >= 0) {
            sliderVolume.scale -= sliderVolume.wheelStep;
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
    sliderVolumeContent.animate({ opacity: [0, 1] }, { duration: 300 });
}, { delay: 150, isThrottle: true });

const hideVolumeDelay = new ExecutionDelay(() => {
    isVolume = false;
    sliderVolumeContent.animate({ opacity: [1, 0], }, { duration: 300 }).onfinish = () => {
        sliderVolumeContent.style.display = "none";
    };
}, { delay: 850, isThrottle: true });
hideVolumeDelay.execute(); // todo

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
