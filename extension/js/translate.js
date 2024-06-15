let Translate = {
    onload: function() {
        title[0].innerText = chrome.i18n.getMessage("title");
        about.innerText = chrome.i18n.getMessage("about");
        contactMe.innerText = chrome.i18n.getMessage("contactMe");
        shortCuts.innerText = chrome.i18n.getMessage("openShortcuts");
        let titleHelp = document.getElementById("help");
        titleHelp.innerText = chrome.i18n.getMessage("helpMenu");
        let writeLettr = document.getElementsByTagName("h3")[0];
        let aMail = document.createElement("A");
        aMail.href = "mailto:NightSoftware@outlook.com";
        aMail.innerText = "NightSoftware@outlook.com";
        writeLettr.innerText = chrome.i18n.getMessage("writeLetter");
        writeLettr.appendChild(aMail);
        getYandexMusicTab().then(tabId => {
            if (tabId == false) {
                btnYes.innerText = chrome.i18n.getMessage("yes");
            } else {
                btnYes.innerText = chrome.i18n.getMessage("reload");
            }
        });
        btnNew.innerText = chrome.i18n.getMessage("new");
        let settings = document.getElementById("settings");
        settings.innerText = chrome.i18n.getMessage("settings");
        showNotify.innerText = chrome.i18n.getMessage("showNotify");
        playPauseNotify.labels[0].innerText = chrome.i18n.getMessage("playPauseNotify");
        prevNextNotify.labels[0].innerText = chrome.i18n.getMessage("prevNextNotify");
        let yesNews = document.getElementById("YesNews");
        yesNews.innerText = chrome.i18n.getMessage("continue");
        let whatNew = document.getElementById("whatNew");
        whatNew.innerText = chrome.i18n.getMessage("whatNew");
        let versions = document.getElementsByClassName("versions")[0];
        versions.innerText = chrome.i18n.getMessage("whatNew");
        let selectColorTheme = document.getElementById("SelectColorTheme");
        selectColorTheme.innerText = chrome.i18n.getMessage("selectTheme");
        let defaultTheme = document.getElementById("DefaultTheme");
        let lightTheme = document.getElementById("LightTheme");
        let darkTheme = document.getElementById("DarkTheme");
        defaultTheme.lastChild.innerText = chrome.i18n.getMessage("defaultTheme");
        lightTheme.lastChild.innerText = chrome.i18n.getMessage("lightTheme");
        darkTheme.lastChild.innerText = chrome.i18n.getMessage("darkTheme");
        let addDislikeButton = document.getElementById("checkBoxDislikeButton");
        addDislikeButton.innerText = chrome.i18n.getMessage("addDislikeButton");
        let checkBoxReassignT = document.getElementById("checkBoxReassign");
        checkBoxReassignT.innerText = chrome.i18n.getMessage("noShortcutSelected");
        let shortcutKeyOpenPopup = document.getElementById("shortcutKeyOpenPopup");
        shortcutKeyOpenPopup.innerText = chrome.i18n.getMessage("shortcutKeyOpenPopup");
        let selectedShortcutKeyT = document.getElementsByClassName("select-shortcut-key")[0];
        selectedShortcutKeyT.innerText = chrome.i18n.getMessage("selectedShortcutKey");
        let allNotifications = document.getElementById("allNotifications");
        allNotifications.innerText = chrome.i18n.getMessage("allNotifications");
        let pinTab = document.getElementById("PinTab");
        if(pinTab) pinTab.innerText = chrome.i18n.getMessage("pinTab");
        document.getElementById("StepChange").innerText = chrome.i18n.getMessage("stepChange");
        document.getElementById("SecondsPosition").innerText = chrome.i18n.getMessage("secondsPosition");
        document.getElementById("InterestVolume").innerText = chrome.i18n.getMessage("interestVolume");
    }
}

EventEmitter.emit("Translate");