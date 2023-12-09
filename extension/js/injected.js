let YandexMusicControl = {
    id: "UnknowId",
    port: undefined,
    mediaSession: undefined,
    MediaMetadata: undefined
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
    if(!currentTrack) return;
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

        MediaMetadata = class { constructor({ }) {} };
        Object.defineProperty(navigator, 'mediaSession', {
            value: {
                setActionHandler() {}
            }
        });

        YandexMusicControl.mediaSession.setActionHandler('play', togglePauseKey);
        YandexMusicControl.mediaSession.setActionHandler('pause', togglePauseKey);
        YandexMusicControl.mediaSession.setActionHandler('previoustrack', previousKey);
        YandexMusicControl.mediaSession.setActionHandler('nexttrack', nextKey);
        YandexMusicControl.mediaSession.setActionHandler('seekbackward', function () {
            externalAPI.setPosition(externalAPI.getProgress().position - 10)
        });
        YandexMusicControl.mediaSession.setActionHandler('seekforward', function () {
            externalAPI.setPosition(externalAPI.getProgress().position + 10)
        });
    }

}

function getTracks() {
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
        trackInfo: trackInfo,
        controls: externalAPI.getControls(),
        volume: externalAPI.getVolume(),
        speed: externalAPI.getSpeed()
    }, );
}

function next() {
    externalAPI.next();
}

function previous() {
    externalAPI.prev();
}

function togglePause() {
    externalAPI.togglePause();
    chrome.runtime.sendMessage(YandexMusicControl.id, {
        event: "togglePause",
        isPlaying: externalAPI.isPlaying()
    }, );
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

let previousKey = () => {
    chrome.runtime.sendMessage(YandexMusicControl.id, { event: "change_track" });
    let promise = externalAPI.prev();
    promise.then(
        function() {
            chrome.runtime.sendMessage(YandexMusicControl.id, {
                key: true,
                dataKey: "previous-key",
                currentTrack: externalAPI.getCurrentTrack()
            });
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

let nextKey = () => {
    chrome.runtime.sendMessage(YandexMusicControl.id, { event: "change_track" });
    let promise = externalAPI.next();
    promise.then(function() {
        chrome.runtime.sendMessage(YandexMusicControl.id, {
            key: true,
            dataKey: "next-key",
            currentTrack: externalAPI.getCurrentTrack()
        });
    });
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
    //getTracks();
}

window.addEventListener("message", function(event) {
    if (event.source != window) { return; }
    
    switch (event.data.function) {
        case 'getCurrentTrack':
            getTracks();
            break;
        case 'togglePause':
            togglePause();
            break;
        case 'previous':
            chrome.runtime.sendMessage(YandexMusicControl.id, { event: "change_track" });
            previous();
            break;
        case 'next':
            chrome.runtime.sendMessage(YandexMusicControl.id, { event: "change_track" });
            next();
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
            previousKey();
            break;
        case 'togglePause-key':
            togglePauseKey();
            break;
        case 'next-key':
            nextKey();
            break;
        case 'toggleLike-key':
            toggleLikeKey();
            break;
    }

    if (event.data.id) {
        YandexMusicControl.id = event.data.id;
        setMediaMetaData();
    }
    if (event.data.play) { 
        chrome.runtime.sendMessage(YandexMusicControl.id, { event: "change_track" });
        externalAPI.play(event.data.play); 
    }
    if (event.data.toggleVolume) { externalAPI.toggleMute(); }
    if (event.data.toggleRepeat) { externalAPI.toggleRepeat(); }
    if (event.data.toggleShuffle) { externalAPI.toggleShuffle(); }
    if (event.data.volume) { externalAPI.setVolume(event.data.volume); }
    if (event.data.hasOwnProperty('getProgress')) {
        chrome.runtime.sendMessage(YandexMusicControl.id, {
            progress: externalAPI.getProgress(),
        });
    }
});

window.onpagehide = () => {
    chrome.runtime.sendMessage(YandexMusicControl.id, { event: "page_hide" });
}

// change track, tracks list
externalAPI.on(externalAPI.EVENT_TRACKS_LIST, function() {
    chrome.runtime.sendMessage(YandexMusicControl.id, {
        event: "TRACKS_LIST",
        tracksList: externalAPI.getTracksList(),
        sourceInfo: externalAPI.getSourceInfo(),
        index: externalAPI.getTrackIndex(),
    });
});

// play, pause, change track
externalAPI.on(externalAPI.EVENT_STATE, function() { 
    const progress = externalAPI.getProgress();
    const isPlaying = externalAPI.isPlaying();
    if (progress.duration == 0 && isPlaying == false) return;

    chrome.runtime.sendMessage(YandexMusicControl.id, { event: "STATE", isPlaying, progress });
    if (isPlaying) {
        YandexMusicControl.mediaSession.playbackState = "playing";
    } else {
        YandexMusicControl.mediaSession.playbackState = "paused";
    }
});

externalAPI.on(externalAPI.EVENT_VOLUME, function() {
    chrome.runtime.sendMessage(YandexMusicControl.id, {
        event: "VOLUME",
        volume: externalAPI.getVolume()
    });
});

externalAPI.on(externalAPI.EVENT_CONTROLS, function() {
    const { repeat, shuffle } = externalAPI.getControls();
    chrome.runtime.sendMessage(YandexMusicControl.id, { event: "CONTROLS", repeat, shuffle, });
});

externalAPI.on(externalAPI.EVENT_SPEED, function() {
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
externalAPI.on(externalAPI.EVENT_TRACK, function() {
    prevPosition = 0;
    getTracks();
    setMediaMetaData();
});

const sendProgress = new ExecutionDelay((progress) => {
    chrome.runtime.sendMessage(YandexMusicControl.id, {
        event: "PROGRESS",
        progress: progress,
    });
}, { isThrottling: true });

externalAPI.on(externalAPI.EVENT_PROGRESS, function() {
    ;({ position, loaded } = externalAPI.getProgress())

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
        sendProgress.execute(externalAPI.getProgress());
        sendPositon = false;
        return;
    }

    if (sendLoaded) {
        sendProgress.start(externalAPI.getProgress());
        sendLoaded = false;
    }

});

setActionHandler();