let extensionId = "UnknowId";
let port;
let lastCase;
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
            externalAPI.setPosition(event.data.time)
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
        extensionId = event.data.id;
        port = chrome.runtime.connect(extensionId);
    }
    if (event.data.play) {
        externalAPI.play(parseInt(event.data.play))
    }
    if (event.data.toggleVolume) {
        externalAPI.toggleMute();
        chrome.runtime.sendMessage(extensionId, {
            volume: externalAPI.getVolume(),
        }, );
    }
    if (event.data.toggleRepeat) {
        chrome.runtime.sendMessage(extensionId, {
            repeat: externalAPI.toggleRepeat(),
        });
    }
    if (event.data.toggleShuffle) {
        chrome.runtime.sendMessage(extensionId, {
            shuffle: externalAPI.toggleShuffle(),
        });
    }
    if (event.data.hasOwnProperty('setVolume')) {
        externalAPI.setVolume(event.data.setVolume);
    }
    if (event.data.hasOwnProperty('getProgress')) {
        chrome.runtime.sendMessage(extensionId, {
            progress: externalAPI.getProgress(),
        });
    }
}, false);

externalAPI.on(externalAPI.EVENT_TRACK, function(event) {
    setMediaSession();
    getTracks();
});
externalAPI.on(externalAPI.EVENT_TRACKS_LIST, function(event) {
    getTracks();
});

let mediaSession = navigator.mediaSession;
if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', function() {
        togglePauseKey();
        navigator.mediaSession.playbackState = "playing";
    });
    navigator.mediaSession.setActionHandler('pause', function() {
        togglePauseKey();
        navigator.mediaSession.playbackState = "paused";
    });
    navigator.mediaSession.setActionHandler('previoustrack', function() {
        previousKey();
    });
    navigator.mediaSession.setActionHandler('nexttrack', function() {
        nextKey();
    });
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
    let iconTrack = current.cover;
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
            { src: iconTrack + '50x50', sizes: '50x50', type: 'image/jpg' },
            { src: iconTrack + '80x80', sizes: '80x80', type: 'image/jpg' },
            { src: iconTrack + '100x100', sizes: '100x100', type: 'image/jpg' },
            { src: iconTrack + '200x200', sizes: '200x200', type: 'image/jpg' },
            { src: iconTrack + '300x300', sizes: '300x300', type: 'image/jpg' },
            { src: iconTrack + '400x400', sizes: '400x400', type: 'image/jpg' },

        ]
    });
}

function getTracks() {
    let trackInfo = {
        tracksList: externalAPI.getTracksList(),
        sourceInfo: externalAPI.getSourceInfo(),
        index: externalAPI.getTrackIndex(),
    }
    chrome.runtime.sendMessage(extensionId, {
        event: "currentTrack",
        api: externalAPI.getCurrentTrack(),
        isPlaying: externalAPI.isPlaying(),
        progress: externalAPI.getProgress(),
        trackInfo: trackInfo,
        controls: externalAPI.getControls(),
        volume: externalAPI.getVolume(),
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
    chrome.runtime.sendMessage(extensionId, {
        event: "togglePause",
        isPlaying: externalAPI.isPlaying()
    }, );
}

function toggleLike() {
    externalAPI.toggleLike();
    chrome.runtime.sendMessage(extensionId, {
        event: "toggleLike",
        isLiked: externalAPI.getCurrentTrack().liked
    });
}
let toggleDislike = () => {
    externalAPI.toggleDislike();
    chrome.runtime.sendMessage(extensionId, {
        event: "toggleDislike",
        disliked: { disliked: externalAPI.getCurrentTrack().disliked, notifyMe: true }
    });
}

let previousKey = () => {
    let promise = externalAPI.prev();
    promise.then(
        function() {
            chrome.runtime.sendMessage(extensionId, {
                key: "key",
                dataKey: "previous-key",
                currentTrack: externalAPI.getCurrentTrack()
            });
        });
}
let togglePauseKey = () => {
    externalAPI.togglePause();
    chrome.runtime.sendMessage(extensionId, {
        key: "key",
        dataKey: "togglePause-key",
        currentTrack: externalAPI.getCurrentTrack()
    });
    getTracks();
}
let nextKey = () => {
    let promise = externalAPI.next();
    promise.then(function() {
        chrome.runtime.sendMessage(extensionId, {
            key: "key",
            dataKey: "next-key",
            currentTrack: externalAPI.getCurrentTrack()
        });
    });
}
let toggleLikeKey = () => {
    externalAPI.toggleLike();
    chrome.runtime.sendMessage(extensionId, {
        key: "key",
        dataKey: "toggleLike-key",
        currentTrack: externalAPI.getCurrentTrack().liked
    });
    getTracks();
}