let YandexMusicControl = {
    id: "UnknowId",
    port: undefined,
    actionHandler: undefined
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

let setMediaSession = () => {
    let current = externalAPI.getCurrentTrack();
    let iconTrack;
    if (current == undefined) {
        return;
    }
    iconTrack = current.cover;
    if (iconTrack == undefined) {
        iconTrack = 'img/icon.png'
    } else {
        iconTrack = iconTrack.slice(0, -2);
        iconTrack = 'https://' + iconTrack; // + "400x400"
    }
    navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: getArtists(externalAPI.getCurrentTrack()),
        artwork: [
            { src: iconTrack + "50x50", sizes: "50x50", type: "image/jpeg" },
            { src: iconTrack + "80x80", sizes: "80x80", type: "image/jpeg" },
            { src: iconTrack + "100x100", sizes: "100x100", type: "image/jpeg" },
            { src: iconTrack + "200x200", sizes: "200x200", type: "image/jpeg" },
            { src: iconTrack + "300x300", sizes: "300x300", type: "image/jpeg" },
            { src: iconTrack + "400x400", sizes: "400x400", type: "image/jpeg" },
        ]
    });
    if (externalAPI.isPlaying()) {
        navigator.mediaSession.playbackState = "playing";
    } else {
        navigator.mediaSession.playbackState = "paused";
    }
    //setActionHandler();

}

let setActionHandler = () => {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', function() {
            navigator.mediaSession.playbackState = "playing";
            togglePauseKey();
        });
        navigator.mediaSession.setActionHandler('pause', function() {
            navigator.mediaSession.playbackState = "paused";
            togglePauseKey();
        });
        navigator.mediaSession.setActionHandler('previoustrack', function() {
            previousKey();
        });
        navigator.mediaSession.setActionHandler('nexttrack', function() {
            nextKey();
        });

        navigator.mediaSession.setActionHandler('seekbackward', function() {
            externalAPI.setPosition(externalAPI.getProgress().position - 10)
        });

        navigator.mediaSession.setActionHandler('seekforward', function() {
            externalAPI.setPosition(externalAPI.getProgress().position + 10)
        });

        // need to set empty function, because Yandex.Music overrides the ActionHandler when switching tracks.
        // may be Yandex music was updated in November-December 2022
        YandexMusicControl.actionHandler = navigator.mediaSession.setActionHandler;  
        navigator.mediaSession.setActionHandler = ()=>{};
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
            previous();
            break;
        case 'next':
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
        setMediaSession();
    }
    if (event.data.play) { externalAPI.play(event.data.play); }
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
    chrome.runtime.sendMessage(YandexMusicControl.id, {
        event: "STATE",
        isPlaying: externalAPI.isPlaying(),
        progress: externalAPI.getProgress(),
    });
    if (externalAPI.isPlaying()) {
        navigator.mediaSession.playbackState = "playing";
    } else {
        navigator.mediaSession.playbackState = "paused";
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
    setMediaSession();
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