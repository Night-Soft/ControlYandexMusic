let WhatNew = {
    openNews: (isTimer = false) => {
        let showNew = () => {
            modalNews.style.display = "flex";
            let i = 7;
            if (isTimer) {
                yesNews.innerHTML += " " + i;
                yesNews.disabled = true;
                let setTimer = () => {
                    if (i == 1) {
                        yesNews.disabled = false;
                        yesNews.classList.remove("yesNews-disable")
                        yesNews.onclick = () => { modalNews.style.display = "none"; }
                    }
                    if (i == 0) {
                        yesNews.innerHTML = yesNews.innerHTML.slice(0, -2);
                        clearInterval(delay);
                        return;
                    }
                    yesNews.innerHTML = yesNews.innerHTML.slice(0, -1);
                    yesNews.innerHTML += i - 1;
                    if (i >= 0) { i--; }

                }
                let delay = setInterval(setTimer, 1000);
            } else {
                yesNews.disabled = false;
                yesNews.classList.remove("yesNews-disable");
                yesNews.onclick = () => { modalNews.style.display = "none"; }
            }
        }
        WhatNew.setLocale(WhatNew.getLocale(), showNew);

    },
    getLocale: () => {
        let locale = chrome.i18n.getMessage("locale");
        return locale;
    },
    getWhatNew: async() => {
        let response = fetch("../whatNew.json");
        return new Promise(function(resolve, reject) {
            response.then((data) => {
                data.json().then((value) => {
                    value["success"] = true;
                    resolve(value);
                });
            }, (data) => {
                console.log("error", data);
                data["success"] = false;
                reject(data)
            });
        });
    },
    setLocale: (locale, callback) => {
        let whatNewJson = WhatNew.getWhatNew().then((value) => {
            if (!value["success"]) { return; }
            whatNewJson = value;
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