let WhatNew = {
    _isCreated: false,
    get isCreated() { return this._isCreated },
    set isCreated(value) {
        if (typeof value === "boolean") this._isCreated = value;
    },
    openNews() {
        const animate = () => {
            modalNews.style.display = "flex";
            modalNews.animate({ opacity: [0, 1] }, { duration: 400 });
        }
        if (!this._isCreated) {
            this.setLocale(translate("locale"), animate);
            return;
        }
        animate();
    },
    getWhatNew: async () => {
        try {    
            const result = await (await fetch("../data/what-new.json")).json();
            return Promise.resolve(result.versions);
        } catch (error) {
            return Promise.reject(error);
        }
    },
    setLocale(locale, animate) {
        this.getWhatNew().then((versions) => {
            let version = document.getElementById("Version");
            version.innerText = translate("shortName") + " " + chrome.runtime.getManifest().version;
            let listChangesContent = document.getElementsByClassName("list-changes-coontent")[0];

            const messageLng = locale === "RU" ? "messageRu": "messageEn"
            const predicate = function ({ value }) {
                const [version, messages] = value;
                const message = messages[messageLng];
                return { message, version }
            }
            new Component([
                ["div", { class: "version-changes" },
                    ["h2", {  id: "Version" }, "{{ version }}"],
                    ["h2", { "$innerHTML": true, class: "versions" }, "{{ message }}"]
                ]
            ], versions, predicate).appendToElement(listChangesContent);
            this.isCreated = true;
            
            animate();
        });
    }
}