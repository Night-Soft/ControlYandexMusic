let payPal = document.getElementsByClassName("paypal")[0];
let donationAlerts = document.getElementsByClassName("donationalerts")[0];
let title = document.getElementsByClassName("title")[0];
let manifestData = chrome.runtime.getManifest();
let titleAbout = document.getElementsByClassName("title-about")[0];
let buttonAbout = document.getElementsByClassName("button-about")[0];
let buttonWhatNew = document.getElementsByClassName("button-what-new")[0];
let about = document.getElementsByClassName("about")[0];
let aboutWhatNew = document.getElementsByClassName("about-what-new")[0];

let language = navigator.language;

payPal.onclick = () => {
    window.open("https://www.paypal.com/paypalme2/NightSoftware");
}
donationAlerts.onclick = () => {
    window.open("https://www.donationalerts.com/r/nightsoftware");
}
if (language == "ru") {
    title.innerHTML = chrome.i18n.getMessage("title");
}
titleAbout.innerHTML += " " + manifestData.version;
buttonAbout.style.background = "#FF3333";
buttonWhatNew.style.background = "";
aboutWhatNew.style.display = "none";
buttonAbout.onclick = () => {
    buttonAbout.style.background = "#FF3333";
    buttonWhatNew.style.background = "";
    aboutWhatNew.style.display = "none";
    about.style.display = ""; // show
    about.classList.add("flip-vertical-left");
}
buttonWhatNew.onclick = () => {
    buttonWhatNew.style.background = "#FF3333";
    buttonAbout.style.background = "";
    about.style.display = "none";
    aboutWhatNew.style.display = ""; // show
    aboutWhatNew.classList.add("flip-vertical-left");

}


let WhatNew = {
    getLocale: () => {
        return chrome.i18n.getMessage("locale");
    },
    getWhatNew: async() => {
        let response = fetch("../data/what-new.json");
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
    setWhatNew: (callback) => {
        let locale = WhatNew.getLocale();
        let whatNewJson = WhatNew.getWhatNew().then((value) => {
            if (!value["success"]) { return; }
            whatNewJson = value;
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
        });
    }
}
WhatNew.setWhatNew();