let WhatNew = {
    isNew: false, // fro open from translate
    openNews: (frist = false) => {
        WhatNew.setLocale(WhatNew.getLocale());
        modalNews.style.display = "flex";
        let i = 7;
        if (frist) {
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


    },
    getLocale: () => {
        let locale = chrome.i18n.getMessage("locale");
        return locale;
    },
    getWhatNew: () => {
        let request = new XMLHttpRequest();
        request.open("GET", "./whatNew.json", false);
        request.send(null)
        let whatNewJson = JSON.parse(request.responseText);
        return whatNewJson;
    },
    setLocale: (locale) => { //whatNewJson["versions"][0][1].messageEn // versoin - whatNewJson["versions"][0][0]
        let whatNewJson = WhatNew.getWhatNew();
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
    },
}