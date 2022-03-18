var playPauseNotify = document.getElementById('n1');
var prevNextNotify = document.getElementById('n2');
let Options = {
    onload: function() {
        //checkStorage();
        sendEventBackground({ getOptions: "all" });
        //setkey();
    },
    isPlayPauseNotify: undefined,
    isPrevNextNotify: undefined,
    version: undefined,
    innewversion: undefined
};

playPauseNotify.onclick = () => {
    sendEventBackground({ writeOptions: true, options: { isPlayPuaseNotify: playPauseNotify.checked } });
    //sendEventBackground({ getOptions: { response: true, paramter: ["isPlayPauseNotify"] } });

    //chrome.storage.local.set({ key1: playPauseNotify.checked });
    //sendEventBackground({ getOptions: { getOptions: true } });


}
prevNextNotify.onclick = () => {
    sendEventBackground({ writeOptions: true, options: { isPrevNextNotify: prevNextNotify.checked } });
    sendEventBackground({ getOptions: { response: true, paramter: ["isPrevNextNotify"] } });

    // chrome.storage.local.set({ key2: prevNextNotify.checked });

}
let Example = {
        key1: { playPauseNotify: undefined },
        key2: { prevNextNotify: undefined },
        version: { version: undefined },
        innewversion: { innewversion: undefined }
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
        let manifestData = chrome.runtime.getManifest();
        let inCurrentVersion = WhatNew.getWhatNew().then((value) => {
            if (!value["success"]) { return; }
            inCurrentVersion = value;
            inCurrentVersion = inCurrentVersion["versions"][0][1].messageEn;
            getInNewVersion().then((inNewValue) => {
                if (value != manifestData.version && inNewValue != inCurrentVersion) {
                    chrome.storage.local.set({ version: manifestData.version }); // set new version
                    chrome.storage.local.set({ innewversion: inCurrentVersion }); // set text what new
                    WhatNew.openNews(true); // true - for open with timer

                }
            });
        }); // get json
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

function getInNewVersion() {
    return new Promise(function(resolve, reject) {
        chrome.storage.local.get(['innewversion'], function(result) {
            resolve(result.innewversion)
        });
    });
}

// get and set key value to frontend
// function setkey() {
//     getKey1().then(function(value) {
//         playPauseNotify.checked = value;

//     });
//     getKey2().then((value) => {
//         prevNextNotify.checked = value;

//     });

// }

let setOptions = (options) => {
    console.log("options set ", options);
    if (options.isPlayPauseNotify != undefined) {
        playPauseNotify.checked = options.isPlayPuaseNotify;
        Options.isPlayPauseNotify = options.isPlayPauseNotify;
    }
    if (options.isPrevNextNotify != undefined) {
        prevNextNotify.checked = options.isPrevNextNotify;
        Options.isPrevNextNotify = options.isPrevNextNotify;
    }
    if (options.version != undefined) {
        Options.version = options.version;

    }
    if (options.innewversion != undefined) {
        Options.innewversion = options.innewversion;

    }
}