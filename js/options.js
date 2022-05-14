var playPauseNotify = document.getElementById('n1');
var prevNextNotify = document.getElementById('n2');
let Options = {
    onload: function() {
        sendEventBackground({ getOptions: "all" }, checkNew);
    },
    isPlayPauseNotify: undefined,
    isPrevNextNotify: undefined,
    isShowWhatNew: undefined,
    version: undefined,
    oldVersionDescription: undefined
};

playPauseNotify.onclick = () => {
    sendEventBackground({ writeOptions: true, options: { isPlayPauseNotify: playPauseNotify.checked } });
    setOptions({ isPlayPauseNotify: playPauseNotify.checked });
}

prevNextNotify.onclick = () => {
    sendEventBackground({ writeOptions: true, options: { isPrevNextNotify: prevNextNotify.checked } });
    setOptions({ isPrevNextNotify: prevNextNotify.checked });
}

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
}