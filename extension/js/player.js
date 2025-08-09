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
            track: {
                get() { return this.possibleTracks.list.get(this.index)?.track; }
            },
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
                    return this.playlist.elements.get(this.index)?.item.childNodes[1].childNodes[0];
                }
            }
        });

        this.possibleTracks.list = new BindMap(new Map(), this.possibleTracks, {
            set(key) { // key === index
                if (Number.isFinite(this.maxIndex) === false) {
                    this.maxIndex = key;
                }
                if (Number.isFinite(this.minIndex) === false) {
                    this.minIndex = key;
                    return;
                }
                this.updateMinMaxIndex(key);
            },
            delete(key) {
                const indexes = Array.from(this.list.keys());
                const splicedIndexes = indexes.toSpliced(indexes.indexOf(key), 1);
                if (splicedIndexes.length === 0) {
                    console.warn("delete error");
                    return;
                }
                const minIndex = Math.min(...splicedIndexes);
                const maxIndex = Math.max(...splicedIndexes);
                this.updateMinMaxIndex(minIndex);
                this.updateMinMaxIndex(maxIndex);
            },
            clear() {
                this.maxIndex = undefined;
                this.minIndex = undefined;
            }
        }, false);
    }
    info = {
        source: {},
        tracks: []
    }
    possibleTracks = {
        maxIndex: undefined,
        minIndex: undefined,

        get isFullList() { 
            const { unloaded } = getUnrealizedIndexes();
            return unloaded.length === 0;
        },

        updateMinMaxIndex(index) {
            if (index > this.maxIndex) this.maxIndex = index;
            if (index < this.minIndex) this.minIndex = index;
        },
        update(tracksList) {
            tracksList.forEach((track, index) => {
                if (typeof track === "object" && track !== null) {
                    Player.possibleTracks.list.set(index, { index, track });
                }
            });
        },
        getConsistent(fromIndex = this.minIndex, toIndex = this.maxIndex) {
            const minIndex = this.minIndex;
            const maxIndex = this.maxIndex;

            if (toIndex > maxIndex) toIndex = maxIndex;
            if (fromIndex < minIndex) fromIndex = minIndex;

            const { unloaded } = getUnrealizedIndexes(fromIndex, toIndex);

            return {
                is: unloaded.length === 0,
                unloaded
            }
        },
    }
    playlist = new Playlist();
    index;
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
    clearPlaylist() {
        this.possibleTracks.list.clear();
        this.playlist.clear();
        this.index = -1;
    }
    updateCanUploadTracks() {
        this.canUploadTracks = this.info.tracks.some(track => track === null);
    }
    updateLikeDislike(tracksList) {
        const newLikes = [];
        Player.playlist.elements.forEach(({ item, index }) => {
            const { liked: likedPrev, disliked: dislikedPrev } = Player.info.tracks[index];
            const { liked, disliked } = tracksList[index];
            if (likedPrev === liked && dislikedPrev === disliked) return;

            newLikes.push({ item, liked, disliked });
        });
        newLikes.forEach(({ item, liked, disliked }) => {
            toggleListLikes(item.children[1], liked, disliked);
        });
    }
}

const Player = new PlayerInfo();
const playlist = Player.playlist;

let updateTracksList = ({ tracksList, sourceInfo, index }) => {
    if (index < 0) return;

    if (compareSource(sourceInfo, tracksList)) {
        Player.possibleTracks.update(tracksList);
        Player.updateLikeDislike(tracksList);
        Player.info.tracks = tracksList;
        Player.updateCanUploadTracks();
        playlist.waitingElements.create();

        addElementsIfNeeded(index);

        if (Player.index === index) return;

        const selectedItem = playlist.elements.get(index)?.item;
        if (selectedItem) selectItem(selectedItem, index);

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

    Player.possibleTracks.update(tracksList);

    Player.updateCanUploadTracks();
    updateTitle(Player.info.source);

    const numberOfElementsCreated = 60;
    const indexes = getIndexesForCreated(index, numberOfElementsCreated);

    addPlaylistElements(indexes, index);

    if (playlist.isInit === false) playlist.init();
}

let addPlaylistElements = (indexesForCreated, currentTabIndex) => {
    if (indexesForCreated === undefined || indexesForCreated.length === 0) return;

    let isTimeGreaterThanOneHour = false;

    function predicate({ value: index }, item) {
        const likeItem = item.childNodes[1].childNodes[0];
        const itemCover = item.childNodes[0].childNodes[0];
        const contentItemName = item.childNodes[0].childNodes[1];
        const { index: tabIndex, track } = Player.possibleTracks.list.get(index);
        const coverCick = function () {
            Player.coverItem = this;
            openCover(this, track.cover);
        }
        const onmouseenter = (ev) => {
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            if (ev.target == item) {
                if (!track.liked && !track.disliked && Player.index == index) {
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
            if (ev.target == item) {
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

        listLikeControl(likeItem, index);

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
                    ["div", { class: "item-artists", }, "{{artistsTitle}}"],
                ],
            ],
            ["div", { class: "like-time" },
                ["div", { class: "{{likeClass}}" }],
                ["span", { class: "track-time" }, "{{duration}}"]
            ]
        ]
    ];

    const item = new Component(template, indexesForCreated, predicate).nodes;
    indexesForCreated.forEach((indexVal, index) => {
        const indexInList = Player.possibleTracks.list.get(indexVal).index;
        const referenceElement = playlist.getReferenceElement(indexVal);

        listTracks.insertBefore(item[index], referenceElement);
        playlist.elements.set(indexInList, {
            item: item[index],
            index: indexInList,
        });

        if (currentTabIndex === indexInList) {
            selectItem(item[index], indexInList);
            playlist.isScrollToCenter = true;
        }
    });

    updatePlaylistRects.execute();
    return true;
}

const compareTracksTitle = (newTracksList) => {
    const prevTracksList = Player.info.tracks;

    if (newTracksList.length !== prevTracksList.length) return false;

    const newTitlesSet = new Set(newTracksList.filter(track => track !== null).map(track => track.title));
    const prevTitles = prevTracksList.filter(track => track !== null).map(track => track.title);

    return prevTitles.every(title => newTitlesSet.has(title));
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

const getIndexesForCreated = (fromIdx, quantity = 10, insertDirection = "center") => {
    const { maxIndex, minIndex } = Player.possibleTracks;
    const size = Player.possibleTracks.list.size;
    quantity = Math.min(quantity, size);

    let startIndex, endIndex;

    switch (insertDirection) {
        case "up":
            startIndex = Math.max(fromIdx - quantity, minIndex);
            endIndex = fromIdx;
            break;

        case "down":
            startIndex = fromIdx;
            endIndex = Math.min(fromIdx + quantity, maxIndex);
            break;
        case "center":
            const half = Math.floor(quantity % 2 === 1 ? (quantity - 1) / 2 : quantity / 2);

            fromIdx = quantity % 2 === 1 ? fromIdx : fromIdx + 1;

            startIndex = fromIdx - half;
            const startRest = startIndex >= minIndex ? 0 : minIndex - startIndex;

            endIndex = fromIdx + half + startRest - (quantity % 2 === 1 ? 0 : 1);
            const endRest = endIndex <= maxIndex ? 0 : endIndex - maxIndex;

            startIndex = (
                startIndex - endRest <= minIndex ?
                    minIndex :
                    startIndex - endRest
            );
            endIndex = endIndex <= maxIndex ? endIndex : maxIndex;
            break;
    }

    return getUnrealizedIndexes(startIndex, endIndex).notCreated;
}

const getUnrealizedIndexes = (fromIdx = 0, toIdx = Player.info.tracks.length - 1) => {
    if (typeof fromIdx !== "number" || typeof toIdx !== "number") throw new TypeError();

    if (fromIdx < 0) fromIdx = 0;
    if (toIdx > Player.info.tracks.length - 1) toIdx = Player.info.tracks.length - 1;

    const notCreated = [], unloaded = [];
    for (let i = fromIdx; i <= toIdx; i++) {
        if (playlist.elements.has(i)) continue;
        if (Player.possibleTracks.list.has(i)) {
            notCreated.push(i);
            continue;
        }
        unloaded.push(i);
    }

    return { notCreated, unloaded };
}

const checkAddElements = (direction) => {
    if (Player.playlist.isFullList) return;

    const quantity = Math.ceil(getIndexesInView().size * 1.5);
    const index = direction === "up" ? playlist.minIndex : playlist.maxIndex;

    const indexes = getIndexesForCreated(index, quantity, direction);
    return { indexes, is: addPlaylistElements(indexes) };
}

const needElements = (direction, quantity = 5) => {
    const index = direction === "up" ? playlist.minIndex : playlist.maxIndex;
    const indexes = getIndexesForCreated(index, quantity, direction);

    return indexes.length > 0;
}

const needElementsUpload = (direction = "down") => {
    const indexesInView = getIndexesInView().indexes;
    const quantity = Math.ceil(indexesInView.length * 2);
    const fromIdx = (
        direction === "up" ?
            indexesInView[0] :
            indexesInView[indexesInView.length - 1]
    );

    let fromIndex, toIndex;
    switch (direction) {
        case "up":
            fromIndex = fromIdx - quantity;
            toIndex = fromIdx;
            break;

        case "down":
            fromIndex = fromIdx;
            toIndex = fromIdx + quantity;
            break;
    }

    const { unloaded } = getUnrealizedIndexes(fromIndex, toIndex);

    return unloaded.length > 0;
}

const addElementsIfNeeded = (index) => {
    const viewSize = getIndexesInView().size;
    const fromIndex = index - viewSize;
    const toIndex = index + viewSize;
    const { notCreated, unloaded } = getUnrealizedIndexes(fromIndex, toIndex);

    if (notCreated.length > 0) addPlaylistElements(notCreated, index);

    const fromLoadIndex = Math.min(...unloaded);
    if (fromLoadIndex === Infinity) return;

    playlist.waitingElements.include(unloaded);
    populate(fromLoadIndex, Player.waitingElements.size + viewSize);
}

let updateTitle = (title) => {
    if (title.title != undefined) {
        tracksListTitle.innerText = title.title;
    } else {
        tracksListTitle.innerText = title.type;
    }
}

let listLikeControl = (likeItem, index) => {
    likeItem.onclick = () => {
        if (Player.index == index) {
            if (Player.disliked) {
                Player.likeFromPlaylist = true;
                sendEvent("toggleDislike");
                return;
            }
            Player.likeFromPlaylist = true;
            sendEvent("toggleLike");
        }
    }
    likeItem.longpress = () => {
        if (Player.index == index) {
            Player.likeFromPlaylist = true;
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
    if (selectedItem != undefined) {
        selectedItem.classList.remove("selected-item");
        selectedItem.childNodes[1].childNodes[0].classList.remove("list-item-not-liked");
    }
    item.classList.add("selected-item");

    selectedItem = item;
    Player.index = index;

    if (!document.hasFocus() && playlist.isInit) {
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

const listTracksOnScroll = () => {
    updatePlaylistRects.start();
    checkTrackPosition.start();
    checkForNewElement.start();
}

const updatePlaylistRects = new ExecutionDelay((event) => {
    if (event?.type === "resize") Player.playlist.rects.update();
    Player.playlist.elements.updateRects();
}, { delay: 200, isThrottle: true });

const getCurrentfromToIndex = () => {
    const { indexes, size } = getIndexesInView();
    const fromIndex = indexes[0] - size;
    const toIndex = indexes[size - 1] + size;
    return { fromIndex, toIndex }
}

const getCurrentViewConsistent = () => {
    const { fromIndex, toIndex } = getCurrentfromToIndex();
    return playlist.elements.getConsistent(fromIndex, toIndex);
}

const sort = (a, b) => a - b;

const getIndexesInView = () => {
    let playlistTop = playlist.rects.container.top;
    let playlistHeight = playlist.rects.container.height;

    const indexesInView = [];
    playlist.elements.forEach((el, key) => {
        if (
            el.rect.top >= playlistTop - el.rect.height &&
            el.rect.top <= playlistTop + playlistHeight
        ) indexesInView.push(key);
    });

    return { indexes: indexesInView.sort(sort), size: indexesInView.length };
}

const checkTrackPosition = new ExecutionDelay(() => {
    const rect = playlist.elements.get(Player.index)?.rect; // selectedItem
    if (rect === undefined) return;

    let { height, top } = rect;
    let playlistTop = playlist.rects.container.top - height;

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

const createWaitingElements = (direction) => {
    const quantity = Math.ceil(getIndexesInView().size * 1.5);
    const { minIndex, maxIndex } = playlist;
    const fromIndex = direction === "up" ? minIndex - quantity : maxIndex;
    const toIndex = direction === "up" ? minIndex : fromIndex + quantity;
    const { unloaded } = getUnrealizedIndexes(fromIndex, toIndex);

    playlist.waitingElements.include(unloaded); 
}

const checkUploadTracks = (direction) => {
    if (Player.possibleTracks.isFullList) return;
    if (!Player.canUploadTracks) return;

    if (direction === "up" && isScrollNotPossible(direction)) {
        const minPlaylistIndex = Player.playlist.minIndex;
        const quantity = Math.max(30, getIndexesInView().size);
        const { unloaded } = getUnrealizedIndexes(minPlaylistIndex - quantity, minPlaylistIndex);
        
        if (unloaded.length === 0) return;

        Player.canAddTracks = true;

        createWaitingElements(direction);
        populate(unloaded[unloaded.length - 1], 0, quantity);

    } else if (direction === "down" && isScrollNotPossible(direction)) {
        const maxPlaylistIndex = Player.playlist.maxIndex;
        const quantity = Math.max(30, getIndexesInView().size);
        const { unloaded } = getUnrealizedIndexes(maxPlaylistIndex, maxPlaylistIndex + quantity);
        
        if (unloaded.length === 0) return;

        Player.canAddTracks = true;

        createWaitingElements(direction);
        populate(unloaded[0], quantity, 0);
    }
}

const isScrollNotPossible = (direction, numberOfTracks = 5) => {
    const indexesInView = getIndexesInView().indexes;
    const firstIndex = indexesInView[0];

    let isNoScroll = true, counter = 0;
    if (direction === "up") {
        for (let i = firstIndex; i >= playlist.minIndex; i--) {
            if (playlist.elements.has(i)) counter++;
            if (counter >= numberOfTracks) {
                isNoScroll = false;
                break;
            }
        }

        return isNoScroll;
    }

    const lastIndex = indexesInView[indexesInView.length - 1];
    for (let i = lastIndex; i <= playlist.maxIndex; i++) {
        if (playlist.elements.has(i)) counter++;
        if (counter >= numberOfTracks) {
            isNoScroll = false;
            break;
        }
    }

    return isNoScroll;
}

const addElementsIfScrollPinned = (createdIndexes) => {
    if (isScrollPinnedTo("top")) {
        listTracks.scrollTo(0, calcHeight(createdIndexes));
        playlist.elements.updateRects();

        return;
    }

    if (isScrollPinnedTo("bottom")) {
        const indexes = Array.from(playlist.elements.keys()).forEach((value) => {
            return !createdIndexes.include(value)
        });

        listTracks.scrollTo(0, calcHeight(indexes));
        playlist.elements.updateRects();

        return;
    }

    checkForNewElement.nextStart();
}

const calcHeight = (indexes) => {
    return indexes.reduce((height, index) => {
        return height += playlist.elements.get(index).rect.height;
    }, 0);
}

const isScrollPinnedTo = (direction) => {
    if (playlist.rects.list.height > calcHeight(getIndexesInView().indexes)) return false;

    if (direction === "top") {
        return playlist.elements.first.rect.top - playlist.rects.title.height === playlist.rects.list.top;
    }

    if (direction === "bottom") {
        return playlist.elements.last.rect.bottom === playlist.rects.list.bottom;
    }
}

const checkForNewElement = new ExecutionDelay(() => {
    if (Player.possibleTracks.isFullList && playlist.isFullList) return;

    // todo pinned scrolll

    let indexes;

    if (isScrollNotPossible("up")) {
        if (needElements("up")) indexes = checkAddElements("up").indexes;
        if (needElementsUpload("up")) checkUploadTracks("up");
    }

    if (isScrollNotPossible("down")) {
        if (needElements("down")) indexes = checkAddElements("down").indexes;
        if (needElementsUpload("down")) checkUploadTracks("down");
    }

    const viewConsistent = getCurrentViewConsistent();
    if (!viewConsistent.is) {
        const { notCreated, unloaded } = viewConsistent;

        if (Array.isArray(indexes)) {
            indexes = [...indexes, notCreated];
        } else {
            indexes = notCreated
        }

        addPlaylistElements(notCreated);
        playlist.waitingElements.exclude(notCreated);

        if (unloaded.length > 0) {
            playlist.waitingElements.include(unloaded);

            const { minIndex, quantity: after } = getDataForPopulate(unloaded);
            populate(minIndex, after, 0);
        }
    }

    if (indexes?.length > 0) addElementsIfScrollPinned(indexes);

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

toggleVolume.addEventListener("wheel", (event) => {
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
}, { passive: false });

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
hideVolumeDelay.execute();

toggleVolume.onmouseenter = () => {
    if (isVolume == false) { showVolumeDelay.start(); }
    if (hideVolumeDelay.isStarted) { hideVolumeDelay.stop(); }
}

contentGrooveVolume.onmouseenter = () => {
    if (hideVolumeDelay.isStarted) { hideVolumeDelay.stop(); }
}

contentGrooveVolume.onmouseleave = (event) => {
    if (event.toElement == null) return;
    if (showVolumeDelay.isStarted) { showVolumeDelay.stop(); }
    if (isVolume) { hideVolumeDelay.start(); }
}