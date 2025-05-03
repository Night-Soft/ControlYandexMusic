chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(request) {
        if (typeof request.data === "string") {
            switch (request.data) {
                case 'setTime':
                    window.postMessage({ function: "setTime", time: request.time }, "*");
                    break;
                case 'extensionIsLoad':
                    port.postMessage({ response: { isConnect: true } });
                    window.postMessage({ function: "getCurrentTrack" }, "*");
                    break;
                default:
                    window.postMessage({ function: request.data }, "*");
                    break;
            }
        }
        if (request.commandKey) window.postMessage({ commandKey: request.commandKey }, "*");
        if (request.hasOwnProperty('id')) {
            injectJS(request.id, request.tabId);
            return;
        }
        if (typeof request.data === "object") {
            for (const prop in request.data) {
                if (prop === 'setVolume') {
                    window.postMessage({ volume: request.data.setVolume }, "*");
                    continue;
                }
                window.postMessage({ [prop]: request.data[prop] }, "*");
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
