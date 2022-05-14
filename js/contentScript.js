chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
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
        case 'setTime':
            window.postMessage({ function: "setTime", time: request.time }, "*");
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
    if (request.data.play) {
        window.postMessage({ play: request.data.play }, "*");
    }
    if (request.data.toggleVolume) {
        window.postMessage({ toggleVolume: request.data.toggleVolume }, "*");
    }
    if (request.data.hasOwnProperty('toggleRepeat')) {
        window.postMessage({ toggleRepeat: request.data.toggleRepeat }, "*");
    }
    if (request.data.hasOwnProperty('toggleShuffle')) {
        window.postMessage({ toggleShuffle: request.data.toggleShuffle }, "*");
    }
    if (request.data.hasOwnProperty('setVolume')) {
        window.postMessage({ setVolume: request.data.setVolume }, "*");

    }
});

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
let injectJS = (id) => {
    var injectCode =
        `
        let getId = (id = "${ id }") => {
        return id;
    }`;
    var script = document.createElement('script');
    script.textContent = injectCode;
    (document.head || document.documentElement).appendChild(script);
    script.remove();

    var s = document.createElement('script');
    s.src = chrome.runtime.getURL('js/injected.js');
    s.onload = function() {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
}
let getId = () => {
    chrome.runtime.sendMessage({ getId: "getId" }, function(response) {
        injectJS(response.id);
    });
    setTimeout(() => {
        chrome.runtime.sendMessage({ onload: true });
    }, 2000);
}

getId();