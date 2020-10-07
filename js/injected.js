var extensionId = "oanhfnjahgongaakgbccpgkepeopbhmd";
var port = chrome.runtime.connect(extensionId);
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
        case 'next':
            next();
            break;
        case 'toggleLike':
            toggleLike();
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
}, false);
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
        //setMediaSession();

    });
    navigator.mediaSession.setActionHandler('nexttrack', function() {
        nextKey();
        //setMediaSession();
    });
}
let setMediaSession = () => {
    let current = externalAPI.getCurrentTrack();
    let iconTrack = current.cover;
    if (iconTrack == undefined) {
        iconTrack = "img/icon.png"
    } else {
        iconTrack = iconTrack.slice(0, -2);
        iconTrack = "https://" + iconTrack; // + "400x400"
    }
    navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artists[0].title,
        artwork: [
            { src: iconTrack + '50x50', sizes: '50x50', type: 'image/jpeg' },
            { src: iconTrack + '80x80', sizes: '80x80', type: 'image/jpeg' },
            { src: iconTrack + '100x100', sizes: '100x100', type: 'image/jpeg' },
            { src: iconTrack + '200x200', sizes: '200x200', type: 'image/jpeg' },
            { src: iconTrack + '300x300', sizes: '300x300', type: 'image/jpeg' },
            { src: iconTrack + '400x400', sizes: '400x400', type: 'image/jpeg' },

        ]
    });
}
externalAPI.on(externalAPI.EVENT_TRACK, function(event) {
    setMediaSession();
    getTracks();
})


function getTracks() {

    chrome.runtime.sendMessage(extensionId, {
        data: "currentTrack",
        api: externalAPI.getCurrentTrack(),
        isPlaying: externalAPI.isPlaying(),
    }, );
}

function next() {
    let promise = externalAPI.next();
    promise.then(function() {
        getTracks();
    });
}

function sendTest() {
    window.postMessage({
        type: "FROM_PAGE",
        text: "Hello from the webpage!"
    }, "*");
}

function previous() {
    let promise = externalAPI.prev();
    promise.then(function() {
        getTracks();
    });

}

function togglePause() {
    externalAPI.togglePause();
    chrome.runtime.sendMessage(extensionId, {
        data: "togglePause",
        isPlaying: externalAPI.isPlaying()
    }, );
}

function toggleLike() {
    externalAPI.toggleLike();
    chrome.runtime.sendMessage(extensionId, {
        data: "toggleLike",
        isLiked: externalAPI.getCurrentTrack()
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
            getTracks();

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
        getTracks();
    });
}
let toggleLikeKey = () => {
    externalAPI.toggleLike();
    chrome.runtime.sendMessage(extensionId, {
        key: "key",
        dataKey: "toggleLike-key",
        currentTrack: externalAPI.getCurrentTrack()
    });
    getTracks();

}