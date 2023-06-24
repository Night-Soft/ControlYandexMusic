let Background = {
    connection: {
        port: {},
        isConnected: false,
        async create() {
            return new Promise((resolve, reject) => {
                getYandexMusicTab().then((result) => {
                    if (result) {
                        try {
                            if (this.isConnected == false) {
                                this.port = chrome.tabs.connect(result, { name: chrome.runtime.id });
                                this.isConnected = true;
                            }
                        } catch (error) {
                            this.isConnected = false;
                        }
                        if (this.isConnected == false) {
                            resolve(false);
                        }
                        this.onPortAddListener();
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });
            });
        },
        onPortAddListener() {
            this.port.onDisconnect.addListener((disconnect) => {
                this.isConnected = false;
            });
            this.port.onMessage.addListener(function(request) {
                if (request.response) {
                    response(request.response);
                }
            });
            let response = (answer) => {
                switch (answer.case) {
                    case "extensionIsLoad":
                        console.log("extension Is Load", answer);
                        break;
                }
            }
        }
    },
    isAllReaded: false,
    lastReaded: {
        time: undefined,
        parameters: undefined
    },
}

let Options = {
    isAllNoifications: undefined,
    isPlayPauseNotify: undefined,
    isPrevNextNotify: undefined,
    isShowWhatNew: undefined,
    version: undefined,
    oldVersionDescription: undefined,
    isDarkTheme: undefined,
    theme: undefined,
    isCoverIncrease: undefined,
    isDislikeButton: undefined,
    isSavePosPopup: undefined,
    popupBounds: undefined,
    reassign: undefined,
}

let PopupWindow = class {
    constructor() {
        if (!PopupWindow.instance) {
            PopupWindow.instance = this;
        } else {
            return PopupWindow.instance
        }
        let display = chrome.system.display.getInfo();
        display.then((value) => {
            this.workArea.height = value[0].workArea.height;
            this.workArea.width = value[0].workArea.width;
        }, (reject) => {});
        this.workArea = {
            height: 0,
            width: 0,
        }
        this.bounds = {};
        this.#getBounds();
    }

    windowData = () => {
        const width = () => {
            if (this.bounds != undefined && Object.keys(this.bounds).length !== 0) {
                return this.bounds.width;
            }
            return 250;
        }
        const height = () => {
            if (this.bounds != undefined && Object.keys(this.bounds).length !== 0) {
                if (this.bounds.isTrackListOpen) {
                    return this.bounds.playlistHeight;
                }
                return this.bounds.height;
            }
            return 110;
        }
        const left = () => {
            if (this.bounds != undefined && Object.keys(this.bounds).length !== 0) {
                return this.bounds.left;
            }
            return this.workArea.width - width();
        }
        const top = () => {
            if (this.bounds != undefined && Object.keys(this.bounds).length !== 0) {
                return this.bounds.top;
            }
            return this.workArea.height - height();
        }
        return {
            height: height(),
            width: width(),
            left: left(),
            top: top(),
            focused: true,
            type: "popup",
            url: "../popup.html"
        }
    }
    create(force = false) {
        if (force) {
            return new Promise((resolve, reject) => {
                chrome.windows.create(this.windowData(), (windowData) => {
                    if (Object.keys(this.bounds).length > 0) {
                        windowData.height = this.bounds.height;
                    }
                    Object.assign(this.bounds, windowData);
                    resolve({
                        nowCreated: true,
                        exists: true,
                        message: chrome.i18n.getMessage("successfullyCreated"),
                        popupWindow: windowData
                    });
                });
            });
        }
        return new Promise((resolve, reject) => {
            PopupWindow.checkCreated().then((result) => {
                if (result == false) { // 0 - The window already exists!
                    chrome.windows.create(this.windowData(), (windowData) => {
                        if (Object.keys(this.bounds).length > 0) {
                            windowData.height = this.bounds.height;
                        }
                        Object.assign(this.bounds, windowData);
                        resolve({
                            nowCreated: true,
                            exists: true,
                            message: chrome.i18n.getMessage("successfullyCreated"),
                            popupWindow: windowData
                        });
                    });
                } else {
                    resolve({
                        nowCreated: false,
                        exists: true,
                        message: chrome.i18n.getMessage("windowAlreadyExists"),
                        popupWindow: result
                    });
                }
            });
        });
    }
    updateWindow() {
        return new Promise((resolve, reject) => {
            PopupWindow.checkCreated().then((result) => {
                if (result) {
                    if (result.state == "normal" || result.state == "maximized") {
                        if (result.focused) {
                            chrome.windows.update(result.windowId, { focused: false, state: "minimized" });
                            resolve({ isUpdate: true, state: "minimized", });
                        } else {
                            chrome.windows.update(result.windowId, { focused: true, state: "normal" });
                            resolve({ isUpdate: true, state: "normal", });
                        }
                    } else {
                        chrome.windows.update(result.windowId, { focused: true, state: "normal" });
                        resolve({ isUpdate: true, state: "normal", });
                    }
                }
            });
        });
    }
    static checkCreated() {
        return new Promise((resolve, reject) => {
            let popupWindowList = chrome.windows.getAll({ populate: true, windowTypes: ['popup'] });
            popupWindowList.then((result) => {
                if (result.length) {
                    let windowUrl;
                    for (let i = 0; i < result.length; i++) {
                        windowUrl = result[i].tabs[0].url;
                        if (windowUrl.includes(chrome.runtime.id + "/popup.html")) {
                            this.bounds = result;
                            resolve({
                                state: result[i].state,
                                focused: result[i].focused,
                                windowId: result[i].tabs[0].windowId
                            });
                        }
                    }
                    resolve(false);
                } else {
                    //this.bounds = undefined;
                    resolve(false);
                }
            }, (reject) => {});
        });
    }
     #getBounds() {
        if (Options.popupBounds) {
            PopupWindow.instance.bounds = Options.popupBounds;
            return Options.popupBounds;
        }
        return new Promise((resolve, reject) => {
            getOptions({ parameters: ["popupBounds"] }).then((result) => {
                if(result.popupBounds != undefined) {
                    PopupWindow.instance.bounds = result.popupBounds;
                    resolve(result);
                } else {
                    PopupWindow.instance.bounds = {};
                    resolve(result, {});
                }
            });
        });
    }
}

chrome.commands.onCommand.addListener(function(command) {
    if (command) { // 'next-key' 'previous-key' 'togglePause-key' 'toggleLike-key'
        if (Options.reassign == undefined) {
            getOptions({ parameters: ["popupBounds", "reassign"] }).then((result) => {
                if ("isReassign" in Options.reassign) {
                    if (Options.reassign.isReassign == true && Options.reassign.shortCut.name == command) {
                        createUpdatePopup();
                        return;
                    }
                }
            });
        } else {
            if (Options.reassign.isReassign == true && Options.reassign.shortCut.name == command) {
                createUpdatePopup();
                return;
            } else {
                sendEvent({ commandKey: command, key: true });
            }
        }
    }
});

chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        if (request.eventTrack == true) {
            if (Background.isAllReaded) {
                showNotification(request);
            } else(
                getOptions().then((result) => {
                    showNotification(request);
                })
            )
            return;
        }
        if (request.key == true) {
            if (Background.isAllReaded) {
                showNotification(request);
            } else(
                getOptions().then((result) => {
                    showNotification(request);
                }, (rejected) => {})
            )
        }
        //return true;
    });

chrome.runtime.onMessage.addListener( // content, extension, script
    function(request, sender, sendResponse) {
        if (request.backgroundMessage == "background") {
            setNotifications(request.name, request.artists, request.imageUrl);
        }
        if (request.getId != undefined) {
            if (!Background.connection.isConnected) {
                Background.connection.create();
            }
            getYandexMusicTab().then((result) => {
                if (result) {
                    sendEvent({ id: chrome.runtime.id, tabId: result });
                }
            });
        }
        if (request.getOptions == true) {
            if (Background.isAllReaded) {
                sendResponse({
                    options: Options
                });
            } else {
                getOptions().then((result) => {
                    sendMessage({ options: result });
                });
            }
            return;
        } else if (request.getOptions != undefined) {
            if (request.send != undefined) {
                getOptions(request.getOptions, request.send);
            } else {
                getOptions(request.getOptions);
            }
        }
        if (request.writeOptions != undefined) {
            writeOptions(request.options);
        }
        if (request.savePopupBounds != undefined) {
            writePopupBounds(request.savePopupBounds);
        }
        if (request.createPopup) {
            createUpdatePopup().then((result) => {
                sendResponse(result);
            });
        }
        return true; // 
    });

chrome.windows.onRemoved.addListener((ev) => {
    if (ev == PopupWindow.instance.bounds.id) {
        // write popupBounds when popup window removed
        writePopupBounds(Object.assign({}, PopupWindow.instance.bounds), true);
    }
});

let sendMessage = (event, callback) => {
    chrome.runtime.sendMessage(event, callback);
}

let sendEvent = (event) => { // to content script
    Background.connection.port.postMessage(event);
}

let getYandexMusicTab = () => {
    return new Promise(function(resolve, reject) {
        chrome.tabs.query({
            windowType: "normal"
        }, function(tabs) {
            for (let i = tabs.length - 1; i >= 0; i--) {
                if (tabs[i].url.startsWith("https://music.yandex")) {
                    resolve(tabs[i].id);
                    break;
                } else if (i == 0) {
                    resolve(false);
                }
            }
        });
    });
}

let writePopupBoundsTimer;
let writePopupBounds = (popupBounds, force = false) => {
    //console.log("set popupBounds date to instance", popupBounds)
    PopupWindow.instance.bounds = popupBounds;
    try {
        const del = (obj, arr = ["id", "tabs", "focused", "type", "state", "incognito", "alwaysOnTop"]) => {
            for (let i = 0; i < arr.length; i++) {
                Reflect.deleteProperty(obj, arr[i]);
            }
        }
        del(popupBounds);
        del(Options.popupBounds);
        //console.log("delete unnecessary from popupBounds", popupBounds);
    } catch (error) { }
    // save to instance
    if (Options.isSavePosPopup) {
        if (equalsObj(popupBounds, Options.popupBounds) == false) {
            if (force) {
                clearTimeout(writePopupBoundsTimer);
                // popupBounds saved force
                Options.popupBounds = PopupWindow.instance.bounds;
                writeOptions({popupBounds});
                return;
            }
            if (typeof(writePopupBoundsTimer) != "undefined") {
                clearTimeout(writePopupBoundsTimer);
            }
            Options.popupBounds = PopupWindow.instance.bounds;
            writePopupBoundsTimer = setTimeout(() => {
                //console.log("popupBounds writed with timeout")
                writeOptions({popupBounds});
            }, 15000);
        }
    }
}
// send to get frame
let createUpdatePopup = async() => {
    if (typeof(popupWindow) == 'undefined') {
        popupWindow = new PopupWindow();
    }
    return new Promise((resolve, reject) => { //this
        popupWindow.create().then((result) => {
            if (result.exists && result.nowCreated) {
                sendMessage({ popupCreated: true, windowData: popupWindow.bounds });
            } else if (result.exists) {
                popupWindow.updateWindow();
            }
            resolve(result);
        });
    });

}

const equalsObj = (a, b) => {
    if (a == undefined && b != undefined) return false;
    if (a != undefined && b == undefined) return false;
    if (a == undefined && b == undefined) return true;
    let keys = Object.keys(a);
    for (let i = 0; i < keys.length; i++) {
        if (a[keys[i]] != b[keys[i]]) {
            return false;
        }
    }
    return true;
};

let getArtists = (list, amount = 3) => {
    let getArtistsTitle = (listArtists) => {
        let artists = "";
        for (let i = 0; i < amount; i++) {
            if (listArtists[i] == undefined && i != 0) {
                artists = artists.slice(0, -2);
                return artists;
            }
            artists += listArtists[i].title + "," + " ";
        }
        artists = artists.slice(0, -2);
        return artists;
    }
    if (list.artists.length > 0) {
        return getArtistsTitle(list.artists);
    } else {
        // get from podcast
        if (list.album.hasOwnProperty("title")) {
            return list.album.title;
        }
        return "";
    }
}
let roundedImage = async(imageUrl) => {
    let size = 80;
    if (imageUrl == undefined) {
        imageUrl = "../img/icon.png"
    } else {
        imageUrl = "https://" + imageUrl
        imageUrl = imageUrl.slice(0, -2);
        imageUrl += size + "x" + size;
    }

    let canvas = new OffscreenCanvas(size, size);

    function roundedPath(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    canvas.height = size;
    canvas.width = size;

    let ctx = canvas.getContext('2d');
    const imgblob = await fetch(imageUrl).then(r => r.blob());
    const img = await createImageBitmap(imgblob);

    img.src = imageUrl;
    ctx.save();
    roundedPath(ctx, 0, 0, size, size, 17);
    ctx.clip();
    ctx.drawImage(img, 0, 0, size, size);
    ctx.restore();
    let blobImg;
    await canvas.convertToBlob().then((blob) => {
        blobImg = blob;
    });
    return new Promise((resolve, reject) => {
        let dataUrl;
        let reader = new FileReader();
        reader.onloadend = function() {
            dataUrl = reader.result;
            resolve({ base64Url: dataUrl, isBase64: true });
        }
        if (blobImg) {
            dataUrl = reader.readAsDataURL(blobImg);
        } else {
            dataUrl = "../img/icon.png";
            resolve({ base64Url: dataUrl, isBase64: false });
        }
    })
}

let showNotification = async(request) => {
    let nameArtists = getArtists(request.currentTrack);
    let nameTrack = request.currentTrack.title;
    let iconTrack = request.currentTrack.cover;
    let isLike = request.currentTrack.liked;
    // get options
    if (Background.isAllReaded == false || Background == undefined) {
        await getOptions();
    }
    if (Options.isAllNoifications == true) {
        setNotifications(nameTrack, nameArtists, iconTrack);
        return;
    }
    if (Options.isPlayPauseNotify == true) {
        switch (request.dataKey) {
            case 'togglePause-key':
                setNotifications(nameTrack, nameArtists, iconTrack)
                break;
        }
    }
    if (Options.isPrevNextNotify == true) {
        switch (request.dataKey) {
            case 'next-key':
                setNotifications(nameTrack, nameArtists, iconTrack);
                break;
            case 'previous-key':
                setNotifications(nameTrack, nameArtists, iconTrack);
                break;
        }
    }
    switch (request.dataKey) {
        case 'toggleLike-key':
            let liked = chrome.i18n.getMessage("liked");
            let disliked = chrome.i18n.getMessage("disliked");
            if (isLike) { // noGood
                iconTrack = "../img/like.png";
                nameArtists = liked;
            } else {
                iconTrack = "../img/no-like.png";
                nameArtists = disliked;
            }
            setNotifications(nameTrack, nameArtists, iconTrack)
            break;
    }

}

let lastUrl, lastBase64Url, notificationsTimeout;
let setNotifications = async(trackTitle, trackArtists, iconTrack) => {
    if (iconTrack == undefined) {
        iconTrack = chrome.runtime.getURL("../img/icon.png");
    } else {
        if (iconTrack.startsWith("../") == false) {
            if (lastUrl != iconTrack) {
                lastUrl = iconTrack;
                await roundedImage(iconTrack).then((result) => {
                    iconTrack = result.base64Url;
                    lastBase64Url = result.base64Url;
                });
            } else {
                if (typeof(lastBase64Url) != "undefined") {
                    iconTrack = lastBase64Url;
                }
            }
        }
    }
    if (iconTrack == undefined) {
        iconTrack = chrome.runtime.getURL("../img/icon.png");
    }
    chrome.notifications.getAll((notifications) => {
        if (notifications.YandexMusicControl) {
            chrome.notifications.update("YandexMusicControl", {
                title: trackTitle,
                message: trackArtists,
                iconUrl: iconTrack
            }, function(callback) {
                try {
                    clearTimeout(notificationsTimeout);
                    notificationsTimeout = setTimeout(function() {
                        chrome.notifications.clear("YandexMusicControl");
                    }, 7000);
                } catch (error) {}
            });
        } else {
            chrome.notifications.create("YandexMusicControl", {
                type: "basic",
                title: trackTitle,
                message: trackArtists,
                iconUrl: iconTrack
            }, function(callback) {
                notificationsTimeout = setTimeout(function() {
                    chrome.notifications.clear("YandexMusicControl");
                }, 7000);
            });
        }
    });
}

chrome.notifications.onClicked.addListener((YandexMusicControl) => {
    sendEvent({ commandKey: 'next-key', key: true });
});

let getWhatNew = async() => {
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
}

let readOption = (option) => {
    let date = new Date();
    Background.lastReaded.time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    if (option == true) { // get all options
        return new Promise((resolve, reject) => {
            let OptionsKeys = Object.keys(Options);
            let obj = {}
            for (let i = 0; i < OptionsKeys.length; i++) {
                chrome.storage.local.get([OptionsKeys[i]], function(result) {
                    Options[OptionsKeys[i]] = result[OptionsKeys[i]];
                    obj[OptionsKeys[i]] = result[OptionsKeys[i]];
                    if (OptionsKeys.length - 1 == i) {
                        Background.isAllReaded = true;
                        Background.lastReaded.parameters = OptionsKeys;
                        resolve(obj);
                    }
                });
            }
        });
    }
    if (option.parameters) { // get selected options
        const compare = (arr1, arr2) => {
            let same = [];
            let different = arr1.slice();
            for (let i = 0; i < arr1.length; i++) {
                for (let j = 0; j < arr2.length; j++) {
                    if (arr1[i] == arr2[j]) {
                        same.push(arr1[i]);
                        different.splice(different.indexOf(arr1[i]), 1);
                    }
                }
            }
            return { parameters: same, different };
        }

        return new Promise((resolve, reject) => {
            let { parameters, different } = compare(option.parameters, Object.keys(Options));

            if (different.length > 0) {
                try {
                    throw new Error(`The "${different}" is not defined!`);
                } catch (error) {
                    console.error(error);
                }
            }
            let object = {}
            for (let i = 0; i < parameters.length; i++) {
                chrome.storage.local.get(parameters[i], (result) => {
                    object[parameters[i]] = result[parameters[i]];
                    Options[parameters[i]] = result[parameters[i]];
                    if (i + 1 == parameters.length) {
                        Background.lastReaded.parameters = parameters;
                        resolve(object)
                    }
                });
            }

        });
    }
}

let writeOptions = (option) => {
    let keysOptions = Object.keys(Options);
    let keysOption = Object.keys(option);

    next: for (let i = 0; i < keysOptions.length; i++) {
        for (let j = 0; j < keysOption.length; j++) {
            if (keysOptions[i] == keysOption[j]) {
                chrome.storage.local.set({ [keysOptions[i]]: option[keysOptions[i]] });
                Options[keysOptions[i]] = option[keysOptions[i]];
                continue next;
            }
        }

    }
    if (option.remove) {
        chrome.storage.local.remove(option.remove);
        if (Array.isArray(option.remove)) {
            option.remove.forEach(element => {
                delete Options[element];
            });
            return;
        }
        if (typeof option.remove == "string") {
            delete Options[option.remove];
        }
    }
}

/**
 * option takes parameters.
 * @param {object} option True for get all options.
 * @param {object} option get needed { parameters: ["innewversion", "version"] }.
 * @param {object} send force send message with options.
 * @return {object} Result as object.
 */
let getOptions = async(option = true, send = false) => { // read and send
    if (option != true && typeof option != "object" && !Array.isArray(option)) {
        option = { parameters: [option.toString()] };
    }
    if (Array.isArray(option)) {
        option = { parameters: option }
    }
    return new Promise((resolve, reject) => {
        readOption(option).then((result) => { // read from parameter
            if (option === true) {
                const manifestVersion = chrome.runtime.getManifest().version;
                if (manifestVersion != Options.version) {
                    getWhatNew().then((value) => {
                        if (!value.success) { return; }
                        let currentVersionDescription = value.versions[0][0];
                        if (Options.oldVersionDescription != currentVersionDescription) {
                            writeOptions({
                                version: manifestVersion,
                                oldVersionDescription: currentVersionDescription,
                                isShowWhatNew: true
                            });
                            sendMessage({ options: Options });
                        }
                    });
                }
            }
            resolve(result);
            if (send) {
                sendMessage({ options: Options });
            }
        }, (rejected) => {
            reject(rejected);
            console.log("Read settings error.", rejected);
        });
    });
}
let popupWindow = new PopupWindow();
Background.connection.create();