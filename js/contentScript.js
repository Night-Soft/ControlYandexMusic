chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.key == true) { isKey = true }
    switch (request.data) {
        case 'previous':
            previous();
            break;
        case 'togglePause':
            togglePause();
            break;
        case 'next':
            next();
            break;
        case 'toggleLike':
            toggleLike();
            break;
        case 'extensionIsLoad':
            sendResponse({ isConnect: true })
            getCurrentTrack();
            break;
        default:
            break;
    }
    switch (request.commandKey) {
        case 'previous-key':
            window.postMessage({ commandKey: "previous-key" }, "*");
            break;
        case 'togglePause-key':
            window.postMessage({ commandKey: "togglePause-key" }, "*");
            break;
        case 'next-key':
            window.postMessage({ commandKey: "next-key" }, "*");
            break;
        case 'toggleLike-key':
            window.postMessage({ commandKey: "toggleLike-key" }, "*");
            break;
    }
});

let injectJS = () => {
    var s = document.createElement('script');
    s.src = chrome.runtime.getURL('js/injected.js');
    s.onload = function() {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
    //console.log("js injected");

}
injectJS();

let getCurrentTrack = () => {
    window.postMessage({ function: "getCurrentTrack" }, "*");
}

function togglePause() {
    window.postMessage({ function: "togglePause" }, "*");

}
let previous = () => {
    window.postMessage({ function: "previous" }, "*");

}
let next = () => {
    window.postMessage({ function: "next" }, "*");

}
let toggleLike = () => {
    window.postMessage({ function: "toggleLike" })
}

let nameTrack = "isEmpty";
let nameArtists = ""
let trackTitleNext = document.getElementsByClassName("track__title");
let progressLeft = document.getElementsByClassName("progress__left");
let i = 0;
let isKey = false;
let isBtn = false;
let likes = false;