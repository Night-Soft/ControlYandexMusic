let YandexMusicControl = {
    id: undefined,
    port: undefined,
    isNewDesign: undefined,
    mediaSession: undefined,
    MediaMetadata: undefined,
    actions: ["prev", "next", "previous-key", "next-key"],
    play(action) {
        if (typeof action !== "number" && typeof action !== "string") {
            throw new TypeError(`The '${action}' is not 'number' or 'string'`);
        }
        if (this.actions.find(value => value === action) === undefined && typeof action !== "number") return;
        
        sendProgress.stop();
        let promise;
        if (typeof action === 'string') {
            if (action.endsWith("key")) {
                const key = action.match("prev") !== null ? "prev" : "next";
                promise = externalAPI[key]();
                promise.then(() => onPlayAction(action));
            } else { promise = externalAPI[action](); }
        } else if (isFinite(action)) {
            promise = externalAPI.play(action);
        }

        promise.catch(() => {
            sendMessage("play_error", {
                isPlaying: externalAPI.isPlaying(),
                progress: externalAPI.getProgress()
            });
        });
    }
}

const sendMessage = (type, data) => {
    if (!YandexMusicControl.id) {
        if (!YandexMusicControl.earlyMessages) YandexMusicControl.earlyMessages = new Set();
        YandexMusicControl.earlyMessages.add({ type, data });
        return;
    }

    if (typeof type === 'object') {
        chrome.runtime.sendMessage(YandexMusicControl.id, type);
        return;
    }
    if (typeof type === 'string' && data === undefined) data = {};
    data.event = type;
    chrome.runtime.sendMessage(YandexMusicControl.id, data);
}

let getArtists = (list) => {
    let getArtistsTitle = (listArtists) => {
        let artists = "";
        for (let i = 0; i < 3; i++) {
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
        // get from podcast
        if (list.album.hasOwnProperty("title")) {
            return list.album.title;
        }
        return "";
    }
}

const overrideActionHandler = () => {
    if (!'mediaSession' in navigator) return;

    let playAction = null;
    externalAPI.on(externalAPI.EVENT_TRACK, () => {
        if (!playAction) return;

        onPlayAction(playAction)
        playAction = null;
    });

    const overriddenCallbacks = {
        play: (e) => {
            originCallbacks.get("play")(e);
            onTogglePauseKey();
        },
        pause: (e) => {
            originCallbacks.get("pause")(e);
            onTogglePauseKey();
        },
        previoustrack: (e) => {
            originCallbacks.get("previoustrack")(e);
            playAction = "previous-key";
        },
        nexttrack: (e) => {
            originCallbacks.get("nexttrack")(e);
            playAction = "next-key";
        }
    }

    const originCallbacks = new Map();
    const actions = ["play", "pause", "previoustrack", "nexttrack"];

    const setActionHandler = navigator.mediaSession.setActionHandler;

    navigator.mediaSession.setActionHandler = function (action, callback) {
        if (!actions.includes(action)) {
            setActionHandler.call(this, action, callback);
            return;
        }

        originCallbacks.set(action, callback);
        setActionHandler.call(this, action, overriddenCallbacks[action]);
    }
}

function getTracks(changeTrack = false) {
    let trackInfo = {
        tracksList: externalAPI.getTracksList(),
        sourceInfo: externalAPI.getSourceInfo(),
        index: externalAPI.getTrackIndex(),
    }
    sendMessage("currentTrack", {
        currentTrack: externalAPI.getCurrentTrack(),
        isPlaying: externalAPI.isPlaying(),
        progress: externalAPI.getProgress(),
        controls: externalAPI.getControls(),
        volume: externalAPI.getVolume(),
        speed: externalAPI.getSpeed(),
        trackInfo,
        changeTrack
    });
}

function togglePause() {
    externalAPI.togglePause();
    sendMessage("togglePause", { isPlaying: externalAPI.isPlaying() });
}

function toggleLike() {
    externalAPI.toggleLike();
    sendMessage("toggleLike", { isLiked: externalAPI.getCurrentTrack().liked });
}

let toggleDislike = () => {
    externalAPI.toggleDislike();
    sendMessage("toggleDislike", {
        disliked: externalAPI.getCurrentTrack().disliked
    });
}

let toggleDislikeKey = () => {
    externalAPI.toggleDislike();
    sendMessage("toggleDislike", {
        key: true, 
        dataKey: "toggleDislike-key",
        disliked: externalAPI.getCurrentTrack().disliked,
        currentTrack: externalAPI.getCurrentTrack()
    });
}

const onTogglePauseKey = () => {
    sendMessage({
        key: true,
        dataKey: "togglePause-key",
        currentTrack: externalAPI.getCurrentTrack()
    });
    getTracks();
}

const onPlayAction = (action) => {
    sendMessage({
        key: true,
        dataKey: action,
        currentTrack: externalAPI.getCurrentTrack()
    });
}

let togglePauseKey = () => {
    externalAPI.togglePause();
    onTogglePauseKey();
}


let toggleLikeKey = () => {
    externalAPI.toggleLike();
    sendMessage("toggleLike", {
        key: true, // key: for background script
        dataKey: "toggleLike-key",
        isLiked: externalAPI.getCurrentTrack().liked,
        currentTrack: externalAPI.getCurrentTrack()
    });
}

window.addEventListener("message", function (event) {
    if (event.source != window) { return; }

    switch (event.data.function) {
        case 'getCurrentTrack':
            getTracks();
            break;
        case 'togglePause':
            togglePause();
            break;
        case 'previous':
            YandexMusicControl.play("prev");
            break;
        case 'next':
            YandexMusicControl.play("next");
            break;
        case 'setTime':
            sendProgress.stop();
            externalAPI.setPosition(event.data.time);
            break;
        case 'toggleLike':
            toggleLike();
            break;
        case 'toggleDislike':
            toggleDislike();
            break;
        default:
            break;
    }

    switch (event.data.commandKey) {
        case 'previous-key':
            YandexMusicControl.play("previous-key")
            break;
        case 'togglePause-key':
            togglePauseKey();
            break;
        case 'next-key':
            YandexMusicControl.play("next-key")
            break;
        case 'toggleLike-key':
            toggleLikeKey();
            break;
        case 'toggleDislike-key':
            toggleDislikeKey();
            break;
    }

    if (event.data.id) {
        YandexMusicControl.id = event.data.id;
        if(YandexMusicControl.earlyMessages) {
            YandexMusicControl.earlyMessages.forEach(({ type, data }) => {
                sendMessage(type, data);
            });
            YandexMusicControl.earlyMessages.clear();
            Reflect.deleteProperty(YandexMusicControl, "earlyMessages");
        }
    }
    if (event.data.play >= 0) {
        YandexMusicControl.play(event.data.play);
    }
    if (event.data.volume >= 0) { externalAPI.setVolume(event.data.volume); }
    if (event.data.toggleVolume) { externalAPI.toggleMute(); }
    if (event.data.toggleRepeat) { externalAPI.toggleRepeat(); }
    if (event.data.toggleShuffle) { externalAPI.toggleShuffle(); }
    if (event.data.hasOwnProperty('getProgress')) {
        sendMessage("PROGRESS", { progress: externalAPI.getProgress() });
    }
    if (event.data.uploadTracksMeta) {
        const {
            fromIndex,
            after,
            before
        } = getUploadData(event.data.uploadTracksMeta);

        if (fromIndex === undefined) return;

        externalAPI.populate(fromIndex, after, before).then(() => {
            sendMessage("TRACKS_LIST", {
                tracksList: externalAPI.getTracksList(),
                sourceInfo: externalAPI.getSourceInfo(),
                index: externalAPI.getTrackIndex(),
            });
        }).finally(() => {
            setTimeout(() => { sendMessage("uploadTracksMeta"); }, 3000);
        });
    }
});

const sendCurrentTime = () => {
    let time = 0;
    const intervalCallback = () => {
        let now = Date.now();
        if (now - time >= 1000) {
            time = now;
            sendProgress();
        }
    }
    const timeId = setInterval(intervalCallback, 500);
};

const getUploadData = (data) => {
    if (typeof data === "string") return getDirectionData(data);
    if (Array.isArray(data)) {
        return {
            fromIndex: data[0],
            after: data[1],
            before: data[2]
        }
    }
}

const getDirectionData = (direction = "down") => {
    const trackIndex = externalAPI.getTrackIndex();
    const trackslist = externalAPI.getTracksList();
    let fromIndex;
    if (direction === "up") {
        for (let i = trackIndex; i >= 0; i--) {
            if (trackslist[i] !== null) continue;
            fromIndex = i;
            break;
        }
    } else if (direction === "down") {
        for (let i = trackIndex; i < trackslist.length; i++) {
            if (trackslist[i] !== null) continue;
            fromIndex = i;
            break;
        }
    }
    const after = direction === "down" ? 30 : 0;
    const before = direction === "up" ? 30 : 0;
    return { fromIndex, after, before }
}

// change track, tracks list
externalAPI.on(externalAPI.EVENT_TRACKS_LIST, function () {
    sendMessage("TRACKS_LIST",{
        tracksList: externalAPI.getTracksList(),
        sourceInfo: externalAPI.getSourceInfo(),
        index: externalAPI.getTrackIndex(),
    });
});

// play, pause, change track
externalAPI.on(externalAPI.EVENT_STATE, function () {
    const progress = externalAPI.getProgress();
    const isPlaying = externalAPI.isPlaying();
    if (progress.duration == 0 && isPlaying == false) return;
    if (progress.duration == 0 && isPlaying == true && externalAPI.getNextTrack() == null) {
        setTimeout(() => {
            sendMessage("STATE", {
                isPlaying: externalAPI.isPlaying(),
                progress: externalAPI.getProgress()
            });
        }, 500);
    };

    sendMessage("STATE", { isPlaying, progress });
});

externalAPI.on(externalAPI.EVENT_VOLUME, function () {
    sendMessage("VOLUME", { volume: externalAPI.getVolume() });
});

externalAPI.on(externalAPI.EVENT_CONTROLS, function () {
    const track = externalAPI.getCurrentTrack();
    if(!track) return;
    const { repeat, shuffle } = externalAPI.getControls();
    const { disliked, liked } = externalAPI.getCurrentTrack();
    sendMessage("CONTROLS", { repeat, shuffle, disliked, liked });
});

externalAPI.on(externalAPI.EVENT_SPEED, function () {
    sendMessage("SPEED",{
        speed: externalAPI.getSpeed(),
        progress: externalAPI.getProgress(),
    });
});

let prevPosition = 0,
    position = 0,
    loaded = 0,
    prevLoaded = 0,
    sendPositon = false,
    sendLoaded = false;

// change track
externalAPI.on(externalAPI.EVENT_TRACK, function () {
    prevPosition = 0;
    getTracks(true);
});

const sendProgress = new ExecutionDelay(() => {
    sendMessage("PROGRESS", { progress: externalAPI.getProgress(), });
    prevPosition = position;
    prevLoaded = loaded;
}, { delay: 1000, isThrottle: true, leading: true });

externalAPI.on(externalAPI.EVENT_PROGRESS, function () {
    ; ({ position, loaded } = externalAPI.getProgress())

    if (position - prevPosition >= 1 || loaded - prevLoaded >= 1) {
        sendProgress.start();
    }
});

// if the "trigger" does not exist, it means that the "New Design" is being used.
if (externalAPI.trigger) {
    YandexMusicControl.isNewDesign = false;
    getTracks();
} else {
    YandexMusicControl.isNewDesign = true;
    overrideActionHandler();
    externalAPI.on(externalAPI.EVENT_READY, getTracks);
}