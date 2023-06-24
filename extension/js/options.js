let checkboxAllNotifications = document.getElementById('checkboxAllNotifications');
let playPauseNotify = document.getElementById('n1');
let prevNextNotify = document.getElementById('n2');
let checkBoxIncreaseCover = document.getElementById("n4");
let checkBoxDislikeButton = document.getElementById("n5");
let checkBoxSavePos = document.getElementById("n6");
let checkBoxReassign = document.getElementById("n7");

let defaultTheme = document.getElementById("DefaultTheme");
let lightTheme = document.getElementById("LightTheme");
let darkTheme = document.getElementById("DarkTheme")

let grooveBox = document.querySelector(".groove-box");
let contentReassign = document.getElementsByClassName("content-reassign")[0];
let contentLabel = document.getElementsByClassName("content-label");

let Options = {
    onload: function() {
        sendEventBackground({ getOptions: true }, checkNew);
    },
    isAllNoifications: undefined,
    isPlayPauseNotify: undefined,
    isPrevNextNotify: undefined,
    isShowWhatNew: undefined,
    version: undefined,
    oldVersionDescription: undefined,
    isReduce: false,
    isSavePosPopup: undefined,
    reassign: {
        isReassign: undefined,
        shortCut: undefined
    },
    popupBounds: undefined,
    selectedShortcutKey: undefined

};
checkboxAllNotifications.onclick = () => {
    sendEventBackground({ writeOptions: true, options: { isAllNoifications: checkboxAllNotifications.checked } });
    setOptions({ isAllNoifications: checkboxAllNotifications.checked });
}

playPauseNotify.onclick = () => {
    sendEventBackground({ writeOptions: true, options: { isPlayPauseNotify: playPauseNotify.checked } });
    setOptions({ isPlayPauseNotify: playPauseNotify.checked });
}

prevNextNotify.onclick = () => {
    sendEventBackground({ writeOptions: true, options: { isPrevNextNotify: prevNextNotify.checked } });
    setOptions({ isPrevNextNotify: prevNextNotify.checked });
}

defaultTheme.onclick = () => {
    document.body.style.setProperty("--transitionDuration", "1s");
    sendEventBackground({ writeOptions: true, options: { theme: "default" } });
    setOptions({ theme: "default" });
}

lightTheme.onclick = () => {
    document.body.style.setProperty("--transitionDuration", "1s");
    sendEventBackground({ writeOptions: true, options: { theme: "light" } });
    setOptions({ theme: "light" });
}

darkTheme.onclick = () => {
    document.body.style.setProperty("--transitionDuration", "1s");
    sendEventBackground({ writeOptions: true, options: { theme: "dark" } });
    setOptions({ theme: "dark" });
}

checkBoxIncreaseCover.onclick = function() {
    sendEventBackground({ writeOptions: true, options: { isCoverIncrease: checkBoxIncreaseCover.checked } });
    setOptions({ isCoverIncrease: checkBoxIncreaseCover.checked });
}
checkBoxDislikeButton.onclick = function() {
    sendEventBackground({ writeOptions: true, options: { isDislikeButton: checkBoxDislikeButton.checked } });
    setOptions({ isDislikeButton: checkBoxDislikeButton.checked });
}
checkBoxSavePos.onclick = function() {
    sendEventBackground({ writeOptions: true, options: { isSavePosPopup: checkBoxSavePos.checked } });
    setOptions({ isSavePosPopup: checkBoxSavePos.checked });
}
checkBoxReassign.onclick = function() {
    if (checkBoxReassign.checked) {
        if (Options.selectedShortcutKey != undefined) {
            sendEventBackground({
                writeOptions: true,
                options: {
                    reassign: {
                        isReassign: checkBoxReassign.checked,
                        shortCut: Options.selectedShortcutKey
                    },
                }
            });
            setOptions({
                reassign: {
                    isReassign: checkBoxReassign.checked,
                    shortCut: Options.selectedShortcutKey
                }
            });
        } else {
            checkBoxReassign.checked = false;
            showNotification(chrome.i18n.getMessage("noShortcutSelected"));
        }
    } else {
        setKeyDescription(true);
        sendEventBackground({
            writeOptions: true,
            options: {
                reassign: {
                    isReassign: checkBoxReassign.checked,
                    shortCut: undefined
                },
            }
        });
        setOptions({
            reassign: {
                isReassign: checkBoxReassign.checked,
                shortCut: undefined
            }
        });
    }
}

let sendEventBackground = (event, callback) => { // event should be as object.
    chrome.runtime.sendMessage(event, function(response) {
        if (response != undefined) {
            if (response.options) {
                setOptions(response.options); // options.js
            }
            if (callback != undefined) {
                callback(response);
            }
        }
    });
};
// now the shortcut key which uses as play/ pause will be used for open popup;
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
    if (options.isAllNoifications != undefined) {
        checkboxAllNotifications.checked = options.isAllNoifications;
        Options.isAllNoifications = options.isAllNoifications;
        disabledOptions([contentLabel[2]], [prevNextNotify], !checkboxAllNotifications.checked);
    }
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
    if (options.theme != undefined) {
        switch (options.theme) {
            case "default":
                Options.theme = options.theme;
                defaultTheme.checked = true;
                setTheme("default");
                break;
            case "light":
                Options.theme = options.theme;
                lightTheme.checked = true;
                setTheme("light");
                break;
            case "dark":
                Options.theme = options.theme;
                darkTheme.checked = true;
                setTheme("dark");
                break;
        }
    }
    if (options.isDarkTheme != undefined) { // remove it on next update 
        Options.theme = "dark";
        if (options.isDarkTheme == true) {
            sendEventBackground({ writeOptions: true, options: { theme: "dark", remove: ["isDarkTheme"] } });
            setTheme("dark");
            darkTheme.checked = true;
        }
    }

    if (options.isCoverIncrease != undefined) {
        Options.isCoverIncrease = options.isCoverIncrease;
        checkBoxIncreaseCover.checked = options.isCoverIncrease;
        if (options.isCoverIncrease) {
            setIncreaseCover(true);
        } else {
            setIncreaseCover(false);
        }
    }
    if (options.isDislikeButton != undefined) {
        Options.isDislikeButton = options.isDislikeButton;
        checkBoxDislikeButton.checked = options.isDislikeButton;
        if (options.isDislikeButton) {
            setIncreaseCover(true);
            checkBoxIncreaseCover.checked = true;
            dislike.style.display = "block";
            disabledOptions([contentLabel[3]], [checkBoxIncreaseCover], !checkBoxDislikeButton.checked);
        } else {
            dislike.style.display = "none";
            disabledOptions([contentLabel[3]], [checkBoxIncreaseCover], !checkBoxDislikeButton.checked);
            if (Options.isCoverIncrease == false) {
                setIncreaseCover(false);
                checkBoxIncreaseCover.checked = false;
            }
        }
    }
    if (options.isSavePosPopup != undefined) {
        checkBoxSavePos.checked = options.isSavePosPopup;
        Options.isSavePosPopup = options.isSavePosPopup;
    }
    if (options.popupBounds != undefined) {
        Options.popupBounds = options.popupBounds;
    }
    if (options.reassign != undefined) {
        Options.reassign.isReassign = options.reassign.isReassign;
        Options.reassign.shortCut = options.reassign.shortCut;
        checkBoxReassign.checked = options.reassign.isReassign;
        Options.selectedShortcutKey = options.reassign.shortCut;

    }
}