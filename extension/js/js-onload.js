let JsOnload = {
    Objects: {},
    /** 
     * @param {string} string name of your object
     * @param {function} callback function
    */
    addOnload(objectName, callback) {
        if (typeof this[objectName] != 'object') { // create obj
            this.Objects[objectName] = {
                calls: [],
                onload(remove = true) {
                    for (let i = 0; i < this.calls.length; i++) {
                        this.calls[i]();
                    }
                    if (remove) { this.calls = []; }
                }
            }
            this.Objects[objectName].calls.push(callback);
        } else {
            this.Objects[objectName].calls.push(callback);
        }
    },
    onload(objectName, remove = true) { 
        if (objectName != undefined) {
            if (this.Objects[objectName] != undefined) {
                this.Objects[objectName].onload(remove);
            } else {
                const err = new Error("The "+ objectName + " is undefined");
                console.log("%c"+err, "background: red; color: white; font-weight: bold;");
            }
            return;
        }
        let keys = Object.keys(this.Objects);
        for (let i = 0; i < keys.length; i++) {
            this.Objects[keys[i]].onload();
        }
    }
}