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
                    chrome.runtime.sendMessage(YandexMusicControl.id, {
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
            chrome.runtime.sendMessage(YandexMusicControl.id, {
                event: "play_error",
                isPlaying: externalAPI.isPlaying(),
                progress: externalAPI.getProgress()
            });
        });
    }
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

let setMediaMetaData = () => {
    const currentTrack = externalAPI.getCurrentTrack();
    if (!currentTrack) return;
    let { title, cover, album } = currentTrack;

    if (cover == undefined) {
        cover = 'img/icon.png'
    } else {
        cover = cover.slice(0, -2);
        cover = 'https://' + cover; // + "400x400"
    }

    const newMetaData = {
        title: title,
        album: album.title,
        artist: getArtists(externalAPI.getCurrentTrack()),
        artwork: [30, 50, 80, 100, 200, 300, 400].map(size => {
            size = size + "x" + size;
            return { src: cover + size, sizes: size, type: "image/jpg" }
        })
    }

    YandexMusicControl.mediaSession.metadata = new YandexMusicControl.MediaMetadata(newMetaData);
}

let setActionHandler = () => {
    if ('mediaSession' in navigator) {
        YandexMusicControl.MediaMetadata = MediaMetadata;
        YandexMusicControl.mediaSession = navigator.mediaSession;

        MediaMetadata = class { constructor({ }) { } };
        Object.defineProperty(navigator, 'mediaSession', {
            value: {
                setActionHandler() { }
            }
        });
        const prevKey = YandexMusicControl.play.bind(YandexMusicControl, 'previous-key');
        const nextKey = YandexMusicControl.play.bind(YandexMusicControl, 'next-key');
        YandexMusicControl.mediaSession.setActionHandler('play', togglePauseKey);
        YandexMusicControl.mediaSession.setActionHandler('pause', togglePauseKey);
        YandexMusicControl.mediaSession.setActionHandler('previoustrack', prevKey);
        YandexMusicControl.mediaSession.setActionHandler('nexttrack', nextKey);
        YandexMusicControl.mediaSession.setActionHandler('seekbackward', function () {
            externalAPI.setPosition(externalAPI.getProgress().position - 10)
        });
        YandexMusicControl.mediaSession.setActionHandler('seekforward', function () {
            externalAPI.setPosition(externalAPI.getProgress().position + 10)
        });
    }

}

function getTracks(changeTrack = false) {
    let trackInfo = {
        tracksList: externalAPI.getTracksList(),
        sourceInfo: externalAPI.getSourceInfo(),
        index: externalAPI.getTrackIndex(),
    }
    chrome.runtime.sendMessage(YandexMusicControl.id, {
        event: "currentTrack",
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
    chrome.runtime.sendMessage(YandexMusicControl.id, {
        event: "togglePause",
        isPlaying: externalAPI.isPlaying()
    },);
}

function toggleLike() {
    externalAPI.toggleLike();
    chrome.runtime.sendMessage(YandexMusicControl.id, {
        event: "toggleLike",
        isLiked: externalAPI.getCurrentTrack().liked
    });
}

let toggleDislike = () => {
    externalAPI.toggleDislike();
    chrome.runtime.sendMessage(YandexMusicControl.id, {
        event: "toggleDislike",
        disliked: { disliked: externalAPI.getCurrentTrack().disliked, notifyMe: true }
    });
}

let togglePauseKey = () => {
    externalAPI.togglePause();
    chrome.runtime.sendMessage(YandexMusicControl.id, {
        key: true,
        dataKey: "togglePause-key",
        currentTrack: externalAPI.getCurrentTrack()
    });
    getTracks();
}

let toggleLikeKey = () => {
    externalAPI.toggleLike();
    chrome.runtime.sendMessage(YandexMusicControl.id, {
        event: "toggleLike",
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
        setMediaMetaData();
    }
    if (event.data.play >= 0) {
        YandexMusicControl.play(event.data.play);
    }
    if (event.data.volume >= 0) { externalAPI.setVolume(event.data.volume); }
    if (event.data.toggleVolume) { externalAPI.toggleMute(); }
    if (event.data.toggleRepeat) { externalAPI.toggleRepeat(); }
    if (event.data.toggleShuffle) { externalAPI.toggleShuffle(); }
    if (event.data.hasOwnProperty('getProgress')) {
        chrome.runtime.sendMessage(YandexMusicControl.id, {
            progress: externalAPI.getProgress(),
        });
    }
});

// change track, tracks list
externalAPI.on(externalAPI.EVENT_TRACKS_LIST, function () {
    chrome.runtime.sendMessage(YandexMusicControl.id, {
        event: "TRACKS_LIST",
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
            chrome.runtime.sendMessage(YandexMusicControl.id, {
                event: "STATE",
                isPlaying: externalAPI.isPlaying(),
                progress: externalAPI.getProgress()
            });
        }, 500);
    };

    chrome.runtime.sendMessage(YandexMusicControl.id, { event: "STATE", isPlaying, progress });
    if (isPlaying) {
        YandexMusicControl.mediaSession.playbackState = "playing";
    } else {
        YandexMusicControl.mediaSession.playbackState = "paused";
    }
});

externalAPI.on(externalAPI.EVENT_VOLUME, function () {
    chrome.runtime.sendMessage(YandexMusicControl.id, {
        event: "VOLUME",
        volume: externalAPI.getVolume()
    });
});

externalAPI.on(externalAPI.EVENT_CONTROLS, function () {
    const { repeat, shuffle } = externalAPI.getControls();
    const { disliked, liked } = externalAPI.getCurrentTrack();
    chrome.runtime.sendMessage(YandexMusicControl.id, {
        event: "CONTROLS", repeat, shuffle, disliked, liked
    });
});

externalAPI.on(externalAPI.EVENT_SPEED, function () {
    chrome.runtime.sendMessage(YandexMusicControl.id, {
        event: "SPEED",
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
    setMediaMetaData();
});

const changeTrack = (index) => {
    if (index >= 0) {
        if (externalAPI.getTrackIndex() == index) return;
    } else {
        if (externalAPI.getNextTrack() == null || externalAPI.getPrevTrack() == null) return;
    }
    sendProgress.stop();
    chrome.runtime.sendMessage(YandexMusicControl.id, { event: "change_track" });
}

const sendProgress = new ExecutionDelay(() => {
    chrome.runtime.sendMessage(YandexMusicControl.id, {
        event: "PROGRESS",
        progress: externalAPI.getProgress(),
    });
}, { isThrottling: true });

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

setActionHandler();