let Translate = {
    onload: function() {
        title[0].innerHTML = chrome.i18n.getMessage("title");
        title[1].innerHTML = chrome.i18n.getMessage("title");
        about.innerHTML = chrome.i18n.getMessage("about");
        contactMe.innerHTML = chrome.i18n.getMessage("contactMe");
        shortCuts.innerHTML = chrome.i18n.getMessage("openShortcuts");
        let titleHelp = document.getElementById("help");
        titleHelp.innerHTML = chrome.i18n.getMessage("helpMenu");
        let writeLettr = document.getElementsByTagName("h4")[0];
        let aMail = document.createElement("A");
        aMail.href = "mailto:NightSoftware@outlook.com";
        aMail.innerHTML = "NightSoftware@outlook.com";
        writeLettr.innerHTML = chrome.i18n.getMessage("writeLetter");
        writeLettr.appendChild(aMail);
        if (reload == false) {
            btnYes.innerHTML = chrome.i18n.getMessage("yes");
        } else {
            btnYes.innerHTML = chrome.i18n.getMessage("reload");
        }
        bntNo.innerHTML = chrome.i18n.getMessage("no");
        btnNew.innerHTML = chrome.i18n.getMessage("new");
        let settings = document.getElementById("settings");
        settings.innerText = chrome.i18n.getMessage("settings");
        showNotify.innerHTML = chrome.i18n.getMessage("showNotify");
        playPauseNotify.labels[0].innerHTML = chrome.i18n.getMessage("playPauseNotify");
        prevNextNotify.labels[0].innerHTML = chrome.i18n.getMessage("prevNextNotify");
        let yesNews = document.getElementById("YesNews");
        yesNews.innerHTML = chrome.i18n.getMessage("continue");
        let whatNew = document.getElementById("whatNew");
        whatNew.innerHTML = chrome.i18n.getMessage("whatNew");
        let versions = document.getElementsByClassName("versions")[0];
        versions.innerHTML = chrome.i18n.getMessage("whatNew");
        let checkBoxDarkTheme = document.getElementById("checkBoxDarkTheme");
        checkBoxDarkTheme.innerHTML = chrome.i18n.getMessage("setDarkTheme");
        let checkBoxIncreaseCover = document.getElementById("checkBoxIncreaseCover");
        checkBoxIncreaseCover.innerHTML = chrome.i18n.getMessage("increaseCover");
        let addDislikeButton = document.getElementById("checkBoxDislikeButton");
        addDislikeButton.innerHTML = chrome.i18n.getMessage("addDislikeButton");
        let checkBoxSavePosT = document.getElementById("checkBoxSavePos");;
        checkBoxSavePosT.innerHTML = chrome.i18n.getMessage("checkBoxSavePos");
        let shortcutKeyOpenPopup = document.getElementById("shortcutKeyOpenPopup");;
        shortcutKeyOpenPopup.innerHTML = chrome.i18n.getMessage("shortcutKeyOpenPopup");
        let selectedShortcutKeyT = document.getElementsByClassName("select-shortcut-key")[0];
        selectedShortcutKeyT.innerHTML = chrome.i18n.getMessage("selectedShortcutKey");
        let allNotifications = document.getElementById("allNotifications");
        allNotifications.innerHTML = chrome.i18n.getMessage("allNotifications");
    }
}