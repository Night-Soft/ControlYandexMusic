let playPauseNotify = document.getElementById('n1');
let prevNextNotify = document.getElementById('n2');
let checkBoxDarkTheme = document.getElementById("n3");
let checkBoxIncreaseCover = document.getElementById("n4");
let grooveBox = document.querySelector(".groove-box");
let Options = {
    onload: function() {
        sendEventBackground({ getOptions: "all" }, checkNew);
    },
    isPlayPauseNotify: undefined,
    isPrevNextNotify: undefined,
    isShowWhatNew: undefined,
    version: undefined,
    oldVersionDescription: undefined,
    isReduce: false
};

playPauseNotify.onclick = () => {
    sendEventBackground({ writeOptions: true, options: { isPlayPauseNotify: playPauseNotify.checked } });
    setOptions({ isPlayPauseNotify: playPauseNotify.checked });
}

prevNextNotify.onclick = () => {
    sendEventBackground({ writeOptions: true, options: { isPrevNextNotify: prevNextNotify.checked } });
    setOptions({ isPrevNextNotify: prevNextNotify.checked });
}
checkBoxDarkTheme.onclick = () => {
    document.body.style.setProperty("--transitionDuration", "1s");
    sendEventBackground({ writeOptions: true, options: { isDarkTheme: checkBoxDarkTheme.checked } });
    setOptions({ isDarkTheme: checkBoxDarkTheme.checked });
}

checkBoxIncreaseCover.onclick = function() {
    sendEventBackground({ writeOptions: true, options: { isCoverIncrease: checkBoxIncreaseCover.checked } });
    setOptions({ isCoverIncrease: checkBoxIncreaseCover.checked });
}

let sendEventBackground = (event, callback) => { // event should be as object.
    chrome.runtime.sendMessage(event, function(response) {
        if (response != undefined) {
            setOptions(response.options); // options.js
            if (callback != undefined) {
                callback();
            }
        }
    });
};

// check new version and show what new
let checkNew = () => {
    if (Options.isShowWhatNew == false || Options.isShowWhatNew == undefined) { return };
    WhatNew.openNews(true); // true - for open with timer
    Options.isShowWhatNew = false;
    sendEventBackground({
        writeOptions: true,
        options: {
            isShowWhatNew: false
        }
    });
}

let setOptions = (options) => {
    if (options.isPlayPauseNotify != undefined) {
        playPauseNotify.checked = options.isPlayPauseNotify;
        Options.isPlayPauseNotify = options.isPlayPauseNotify;
    }
    if (options.isPrevNextNotify != undefined) {
        prevNextNotify.checked = options.isPrevNextNotify;
        Options.isPrevNextNotify = options.isPrevNextNotify;
    }
    if (options.isShowWhatNew != undefined) {
        Options.isShowWhatNew = options.isShowWhatNew;
    }
    if (options.version != undefined) {
        Options.version = options.version;
    }
    if (options.oldVersionDescription != undefined) {
        Options.oldVersionDescription = options.oldVersionDescription;
    }
    if (options.isDarkTheme != undefined) {
        Options.isDarkTheme = options.isDarkTheme;
        checkBoxDarkTheme.checked = options.isDarkTheme;
        if (options.isDarkTheme) {
            setDarkTheme();
        } else {
            setDarkTheme(false);
        }
    }
    if (options.isCoverIncrease != undefined) {
        Options.isCoverIncrease = options.isCoverIncrease;
        checkBoxIncreaseCover.checked = options.isCoverIncrease;
        if (options.isCoverIncrease) {
            setIncreaseCover(true)
        } else {
            setIncreaseCover(false);
        }
    }
}