var playPauseNotify = document.getElementById('n1');
var prevNextNotify = document.getElementById('n2');

playPauseNotify.onclick = () => {
    chrome.storage.local.set({ key1: playPauseNotify.checked });

}
prevNextNotify.onclick = () => {
    chrome.storage.local.set({ key2: prevNextNotify.checked });

}
let checkStorage = () => {
    getKey1().then(function(value1) {
        if (typeof(value1) != "boolean") {
            playPauseNotify.checked = true;
            chrome.storage.local.set({ key1: playPauseNotify.checked });
        }
    });
    getKey2().then((value2) => {
        if (typeof(value2) != "boolean") {
            prevNextNotify.checked = true;
            chrome.storage.local.set({ key2: prevNextNotify.checked });
        }
    });

}

function getKey1() {
    return new Promise(function(resolve, reject) {
        chrome.storage.local.get(['key1'], function(result) {
            resolve(result.key1)
        });
    });

}

function getKey2() {
    return new Promise(function(resolve, reject) {
        chrome.storage.local.get(['key2'], function(result) {
            resolve(result.key2)
        });
    });
}

function setkey() {
    getKey1().then(function(value) {
        playPauseNotify.checked = value;

    });
    getKey2().then((value) => {
        prevNextNotify.checked = value;

    });
}
document.addEventListener('DOMContentLoaded', function() {
    checkStorage();
    setkey();
});