let Translate = {
    onload: function() {
        title[0].innerHTML = chrome.i18n.getMessage("title");
        title[1].innerHTML = chrome.i18n.getMessage("title");
        //aritstName[0].innerHTML = chrome.i18n.getMessage("artistName");
        //trackName[0].innerHTML = chrome.i18n.getMessage("trackName");
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
        btnYes.innerHTML = chrome.i18n.getMessage("yes");
        bntNo.innerHTML = chrome.i18n.getMessage("no");
        btnNew.innerHTML = chrome.i18n.getMessage("new");
        settings.innerText = chrome.i18n.getMessage("settings");
        showNotify.innerHTML = chrome.i18n.getMessage("showNotify");
        playPauseNotify.labels[0].innerHTML = chrome.i18n.getMessage("playPauseNotify");
        prevNextNotify.labels[0].innerHTML = chrome.i18n.getMessage("prevNextNotify");
        let version = document.getElementById("Version");
        var manifestData = chrome.runtime.getManifest();
        version.innerHTML = chrome.i18n.getMessage("shortName");
        version.innerHTML += " " + manifestData.version;
        let yesNews = document.getElementById("YesNews");
        yesNews.innerHTML = chrome.i18n.getMessage("yes");
        let whatNew = document.getElementById("whatNew");
        whatNew.innerHTML = chrome.i18n.getMessage("inNewVersion");
        let versions = document.getElementsByClassName("versions")[0];
        versions.innerHTML = chrome.i18n.getMessage("whatNew");
    }
}