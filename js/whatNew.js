let WhatNew = {
    openNews: (isTimer = false) => {
        let showNew = () => {
            modalNews.style.display = "flex";
            let i = 7;
            if (isTimer) {
                yesNews.innerHTML += " " + i;
                yesNews.disabled = true;
                let setTimer = () => {
                    if (i > 0) { i--; }
                    yesNews.innerHTML = yesNews.innerHTML.slice(0, -1);
                    yesNews.innerHTML += i;
                    if (i == 0) {
                        setTimeout(function() { // need for delete "0"
                            yesNews.innerHTML = yesNews.innerHTML.slice(0, -2);
                            yesNews.disabled = false;
                            yesNews.classList.remove("yesNews-disable")
                            yesNews.onclick = () => { modalNews.style.display = "none"; }
                        }, 1000);
                        clearInterval(delay);

                    }
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
        let request = new XMLHttpRequest();
        let whatNewJson = {};
        try {
            request.open("GET", "./whatNew.json", true);
            request.send(null);
        } catch (error) {
            console.log(error);

        }
        return new Promise(function(resolve, reject) {
            request.onload = () => {
                whatNewJson = JSON.parse(request.responseText);
                whatNewJson["success"] = true;
                resolve(whatNewJson);
            }
            request.onerror = () => {
                whatNewJson["success"] = false;
                reject(whatNewJson);
            }
        });


    },
    setLocale: (locale, callback) => {
        let whatNewJson = WhatNew.getWhatNew().then((value) => {
            if (!value["success"]) { return; }
            whatNewJson = value;
            let version = document.getElementById("Version");
            version.innerHTML = chrome.i18n.getMessage("shortName");
            let listChangesCoontent = document.getElementsByClassName("list-changes-coontent")[0];
            listChangesCoontent.innerHTML = "";
            for (let i = 0; i < whatNewJson["versions"].length; i++) {
                console.log(whatNewJson["versions"][i][0]);
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