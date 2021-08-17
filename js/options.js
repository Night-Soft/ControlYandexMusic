var playPauseNotify = document.getElementById('n1');
var prevNextNotify = document.getElementById('n2');
let Options = {
    onload: function() {
        checkStorage();
        setkey();
    }
};

playPauseNotify.onclick = () => {
    chrome.storage.local.set({ key1: playPauseNotify.checked });

}
prevNextNotify.onclick = () => {
    chrome.storage.local.set({ key2: prevNextNotify.checked });

}

// check and set to local storage
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
    getVersion().then((value) => {
        var manifestData = chrome.runtime.getManifest();
        if (value != manifestData.version) {
            chrome.storage.local.set({ version: manifestData.version });
            Extension.isNew = true;
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

function getVersion() {
    return new Promise(function(resolve, reject) {
        chrome.storage.local.get(['version'], function(result) {
            resolve(result.version)
        });
    });
}

// get and set key value to frontend
function setkey() {
    getKey1().then(function(value) {
        playPauseNotify.checked = value;

    });
    getKey2().then((value) => {
        prevNextNotify.checked = value;

    });

}