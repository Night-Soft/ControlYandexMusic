let FileReady = {
    Objects: {},
    _createObj(name){
        this.Objects[name] = {
            loaded: false,
            calls: [],
            onload(remove = true) {
                for (let i = 0; i < this.calls.length; i++) {
                    this.calls[i]();
                }
                if (remove) { this.calls = []; }
            }
        }
    },
    /** 
     * @param {string} key name of your object
     * @param {function} callback your function runs after your file is loaded
    */
    onload(key, callback) {
        if (this.Objects[key] == undefined) {
            this._createObj(key);
            this.Objects[key].calls.push(callback);
        } else {
            this.Objects[key].calls.push(callback);
            if (this.Objects[key].loaded) {
                // console.log(`The '${key}' already loaded`);
                this.Objects[key].onload(true);
            }
        }
    },
    /** 
     * Call this function at the end of your file.
     * The function call all 'onload' functon which added early.
     * @param {string} key name of your object
     * @param {boolean} remove remove all callback
    */
    on(key, remove = true) {
        if (key != undefined) {
            if (this.Objects[key] != undefined) {
                this.Objects[key].loaded = true;
                this.Objects[key].onload(remove);
            } else {
                this._createObj(key);
                this.Objects[key].loaded = true;
                // const warn = "The " + key + " listeners are not defined";
                // console.log("%c" + warn, "background: yellow; color: gray; font-weight: bold;");
            }
            return;
        }
    }
}

chrome.runtime.sendMessage({ getOptions: true }, function (response) {
    if (response != undefined) {
        FileReady.onload("Options", () => {
            if (response.options) {
                setOptions(response.options); // options.js
                checkNew(response);
            }
        });
    }
});

FileReady.onload("Extension", () => { Extension.onload() });
FileReady.onload("Translate", () => { Translate.onload() });