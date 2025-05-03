let YandexMusicControl = {
    id: "UnknowId",
    port: undefined,
    mediaSession: undefined,
    MediaMetadata: undefined,
    actions: ["prev", "next", "previous-key", "next-key"],
    play(action) {
        if (typeof action !== "number" && typeof action !== "string") {
            throw new TypeError(`The '${action}' is not 'number' or 'string'`);
        }
        if (this.actions.find(value => value === action) === undefined && typeof action !== "number") return;
        
        changeTrack(action);
        let promise;
        if (typeof action === 'string') {
            if (action.endsWith("key")) {
                const key = action.match("prev") !== null ? "prev" : "next";
                promise = externalAPI[key]();
                promise.then(() => {
                    sendMessage({
                        key: true,
                        dataKey: action,
                        currentTrack: externalAPI.getCurrentTrack()
                    });
                });
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
        disliked: { disliked: externalAPI.getCurrentTrack().disliked, notifyMe: true }
    });
}

let togglePauseKey = () => {
    externalAPI.togglePause();
    sendMessage({
        key: true,
        dataKey: "togglePause-key",
        currentTrack: externalAPI.getCurrentTrack()
    });
    getTracks();
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
    }

    if (event.data.id) {
        YandexMusicControl.id = event.data.id;
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
        // todo check new design
        externalAPI.uploadTracksMeta(event.data.uploadTracksMeta).finally(() => {
            setTimeout(() => {
                sendMessage("uploadTracksMeta");
            }, 3000);
        });
    }
});

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

const changeTrack = (index) => {
    if (index >= 0) {
        if (externalAPI.getTrackIndex() == index) return;
    } else {
        if (externalAPI.getNextTrack() == null || externalAPI.getPrevTrack() == null) return;
    }
    sendProgress.stop();
    sendMessage("change_track");
}

const sendProgress = new ExecutionDelay(() => {
    sendMessage("PROGRESS", { progress: externalAPI.getProgress(), });
}, { isThrottle: true });

externalAPI.on(externalAPI.EVENT_PROGRESS, function () {
    ; ({ position, loaded } = externalAPI.getProgress())

    if (prevPosition + 1 < position || prevPosition - 1 > position) {
        sendPositon = true;
    }
    prevPosition = position;

    if (loaded > prevLoaded) {
        sendPositon = false;
        sendLoaded = true;
    }
    prevLoaded = loaded;

    if (sendPositon) {
        sendProgress.execute();
        sendPositon = false;
        return;
    }

    if (sendLoaded) {
        sendProgress.start();
        sendLoaded = false;
    }

});

externalAPI.on(externalAPI.EVENT_READY, () => { 
    getTracks();
});