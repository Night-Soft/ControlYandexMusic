let WhatNew = {
    openNews() {
        let showNew = () => {
            modalNews.style.display = "flex";
            yesNews.classList.remove("yesNews-disable");
            yesNews.onclick = () => { modalNews.style.display = "none"; }
        }
        this.setLocale(translate("locale"), showNew);

    },
    getWhatNew: async () => {
        try {    
            const result = await (await fetch("../data/what-new.json")).json();
            return Promise.resolve(result.versions);
        } catch (error) {
            return Promise.reject(error);
        }
    },
    setLocale(locale, callback) {
        this.getWhatNew().then((versions) => {
            let version = document.getElementById("Version");
            version.innerHTML = translate("shortName") + " " + chrome.runtime.getManifest().version;
            let listChangesContent = document.getElementsByClassName("list-changes-coontent")[0];
            listChangesContent.innerHTML = "";

            const messageLng = locale === "RU" ? "messageRu": "messageEn"
            const predicate = function ({ value }) {
                const [version, messages] = value;
                const message = messages[messageLng];
                return { message, version }
            }

            const versionsTemplate = [
                ["div", { class: "version-changes" },
                    ["h2", { id: "Version" }, "{{ version }}"],
                    ["h2", { "a:innerHTML": true, class: "versions" }, "{{ message }}"]
                ]
            ];

            new Component(versionsTemplate, versions, predicate).appendToElement(listChangesContent);
            callback();
        });
    }
}