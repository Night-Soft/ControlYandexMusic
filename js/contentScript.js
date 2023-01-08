chrome.runtime.onConnect.addListener(function(port) {
    Object.defineProperty(port, 'sendResponse', {
        value: (response) => {
            port.postMessage({ response: response });
        }
    });
    port.onMessage.addListener(function(request) {
        switch (request.data) {
            case 'previous':
                window.postMessage({ function: "previous" }, "*");
                break;
            case 'togglePause':
                window.postMessage({ function: "togglePause" }, "*");
                break;
            case 'next':
                window.postMessage({ function: "next" }, "*");
                break;
            case 'toggleLike':
                window.postMessage({ function: "toggleLike" })
                break;
            case 'toggleDislike':
                window.postMessage({ function: "toggleDislike" })
                break;
            case 'setTime':
                window.postMessage({ function: "setTime", time: request.time }, "*");
                break;
            case 'extensionIsLoad':
                port.sendResponse({ case: "extensionIsLoad", isConnect: true });
                window.postMessage({ function: "getCurrentTrack" }, "*");
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
        if (request.hasOwnProperty('id')) {
            injectJS(request.id, request.tabId);
            return;
        }
        if (request.hasOwnProperty('data')) {
            if (request.data.hasOwnProperty('play')) {
                window.postMessage({ play: request.data.play }, "*");
            }
            if (request.data.hasOwnProperty('toggleVolume')) {
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
            if (request.data.hasOwnProperty('getProgress')) {
                window.postMessage({ getProgress: request.data.getProgress }, "*");
            }
        }
    });
});

let injectJS = (id) => {
    let s = document.createElement('script');
    s.src = chrome.runtime.getURL('js/injected.js');
    s.onload = function() {
        window.postMessage({ id: id });
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
}

let getId = () => {
    chrome.runtime.sendMessage({ getId: "getId" });
    setTimeout(() => {
        chrome.runtime.sendMessage({ onload: true });
    }, 2000);
}

getId();