let WhatNew = {
    openNews() {
        let showNew = () => {
            modalNews.style.display = "flex";
            yesNews.classList.remove("yesNews-disable");
            yesNews.onclick = () => { modalNews.style.display = "none"; }
        }
        this.setLocale(chrome.i18n.getMessage("locale"), showNew);

    },
    getWhatNew: async () => {
        try {
            return (await fetch("../data/what-new.json")).json();
        } catch (error) {
            return Promise.reject(error);
        }
    },
    setLocale(locale, callback) {
        this.getWhatNew().then((whatNewJson) => {
            let version = document.getElementById("Version");
            version.innerHTML = chrome.i18n.getMessage("shortName") + " " + chrome.runtime.getManifest().version;
            let listChangesCoontent = document.getElementsByClassName("list-changes-coontent")[0];
            listChangesCoontent.innerHTML = "";
            for (let i = 0; i < whatNewJson["versions"].length; i++) {
                let versionChanges = document.createElement("DIV");
                let version = document.createElement("H2");
                let changes = document.createElement("H2");
                versionChanges.className = "version-changes";
                version.id = "Version";
                changes.className = "versions";
                version.innerHTML = whatNewJson["versions"][i][0];
                switch (locale) {
                    case "EN":
                        changes.innerHTML = whatNewJson["versions"][i][1].messageEn;
                        break;
                    case "RU":
                        changes.innerHTML = whatNewJson["versions"][i][1].messageRu;
                        break;
                    default:
                        changes.innerHTML = whatNewJson["versions"][i][1].messageEn;
                        break;
                }
                versionChanges.appendChild(version);
                versionChanges.appendChild(changes);
                listChangesCoontent.appendChild(versionChanges);
            }
            callback();
        });
    }
}