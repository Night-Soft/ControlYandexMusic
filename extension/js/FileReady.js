let FileReady = {
    Objects: {},
    /** 
     * @param {string} key name of your object
     * @param {function} callback your function runs after your file is loaded
    */
    onload(key, callback) {
        if (typeof this[key] != 'object') { // create obj
            this.Objects[key] = {
                calls: [],
                onload(remove = true) {
                    for (let i = 0; i < this.calls.length; i++) {
                        this.calls[i]();
                    }
                    if (remove) { this.calls = []; }
                }
            }
            this.Objects[key].calls.push(callback);
        } else {
            this.Objects[key].calls.push(callback);
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
                this.Objects[key].onload(remove);
            } else {
                const warn = "The " + key + " listeners are not defined";
                console.log("%c" + warn, "background: yellow; color: gray; font-weight: bold;");
            }
            return;
        }
        let keys = Object.keys(this.Objects);
        for (let i = 0; i < keys.length; i++) {
            this.Objects[keys[i]].onload();
        }
    }
}
