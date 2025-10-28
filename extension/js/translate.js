let Translate = {
    onload: function() {
        title[0].innerText = chrome.i18n.getMessage("title");
        about.innerText = chrome.i18n.getMessage("about");
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
        let skipLike = document.getElementById("SkipLike");
        skipLike.innerText = chrome.i18n.getMessage("skipLike");
        let lightTheme = document.getElementById("LightTheme");
        let darkTheme = document.getElementById("DarkTheme");
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
        document.getElementById("WidthPopup").textContent = chrome.i18n.getMessage("width");
        document.getElementById("HeightPopup").textContent = chrome.i18n.getMessage("height");
        
        document.querySelector("#labelTrackInfo").textContent = chrome.i18n.getMessage("labelTrackInfo");
        document.querySelector("#labelTrackArtists").textContent = chrome.i18n.getMessage("labelTrackArtists");
        document.querySelector("#labelCurrentTime").textContent = chrome.i18n.getMessage("labelCurrentTime");
        document.querySelector("#labelSaveImg").textContent = chrome.i18n.getMessage("labelSaveImg");
        document.querySelector("#AdditionalInfo").textContent = chrome.i18n.getMessage("additionalInfo").replace("(..)", '".."');

    }
}

EventEmitter.emit("Translate");