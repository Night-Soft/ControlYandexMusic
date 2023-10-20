let FileReady = {
    Objects: {},
    /** 
     * @param {string} fileName name of your object
     * @param {function} callback your function runs after your file is loaded
    */
    onload(fileName, callback) {
        if (typeof this[fileName] != 'object') { // create obj
            this.Objects[fileName] = {
                calls: [],
                onload(remove = true) {
                    for (let i = 0; i < this.calls.length; i++) {
                        this.calls[i]();
                    }
                    if (remove) { this.calls = []; }
                }
            }
            this.Objects[fileName].calls.push(callback);
        } else {
            this.Objects[fileName].calls.push(callback);
        }
    },
    /** 
     * Call this function at the end of your file.
     * The function call all 'onload' functon which added early.
     * @param {string} fileName name of your object
     * @param {boolean} remove remove all callback
    */
    on(fileName, remove = true) {
        if (fileName != undefined) {
            if (this.Objects[fileName] != undefined) {
                this.Objects[fileName].onload(remove);
            } else {
                const warn = "The " + fileName + " listeners are not defined";
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
