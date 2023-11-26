chrome.runtime.onConnect.addListener(function(port) {
    console.log(port);
    port.onMessage.addListener(function(request) {
        console.log(request);
        switch (request.data) {
            case 'previous':
                window.postMessage({ function: "previous" }, "*");
                chrome.runtime.sendMessage({ event: "change_track" });
                break;
            case 'togglePause':
                window.postMessage({ function: "togglePause" }, "*");
                break;
            case 'next':
                window.postMessage({ function: "next" }, "*");
                chrome.runtime.sendMessage({ event: "change_track" });
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
                port.postMessage({ case: "extensionIsLoad", isConnect: true });
                window.postMessage({ function: "getCurrentTrack" }, "*");
                break;
            default:
                break;
        }
        switch (request.commandKey) {
            case 'previous-key':
                window.postMessage({ commandKey: "previous-key" }, "*");
                chrome.runtime.sendMessage({ event: "change_track" });
                break;
            case 'togglePause-key':
                window.postMessage({ commandKey: "togglePause-key" }, "*");
                break;
            case 'next-key':
                window.postMessage({ commandKey: "next-key" }, "*");
                chrome.runtime.sendMessage({ event: "change_track" });
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
                window.postMessage({ volume: request.data.setVolume }, "*");
            }
            if (request.data.hasOwnProperty('getProgress')) {
                window.postMessage({ getProgress: request.data.getProgress }, "*");
            }
        }
    });
});

let injectJS = (id) => {
    let ExecutionDelay = document.createElement('script');
    ExecutionDelay.src = chrome.runtime.getURL('js/ExecutionDelay.js');
    ExecutionDelay.onload = function () {
        (document.head || document.documentElement).appendChild(injected);
        this.remove();
    };

    let injected = document.createElement('script');
    injected.src = chrome.runtime.getURL('js/injected.js');
    injected.onload = function () {
        window.postMessage({ id: id });
        this.remove();
    };

    (document.head || document.documentElement).appendChild(ExecutionDelay);
}

let getId = () => {
    chrome.runtime.sendMessage({ getId: "getId" });
    setTimeout(() => {
        chrome.runtime.sendMessage({ onload: true });
    }, 2000);
}

getId();