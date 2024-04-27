let Background = {
    connection: {
        port: {},
        isConnected: false,
        async create() {
            return new Promise((resolve) => {
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
            this.port.onDisconnect.addListener(() => {
                this.isConnected = false;
            });
        }
    },
    isAllReaded: false,
    lastReaded: {
        time: undefined,
        parameters: undefined
    },
}

let Options = {
    defaultPopup: undefined,
    pinTab: undefined,
    positionStep: undefined,
    volumeStep: undefined,
    isAllNoifications: undefined,
    isPlayPauseNotify: undefined,
    isPrevNextNotify: undefined,
    isShowWhatNew: undefined,
    version: undefined,
    oldVersionDescription: undefined,
    isDarkTheme: undefined,
    theme: undefined,
    isButtonsReduced: undefined,
    isDislikeButton: undefined,
    isSaveSizePopup: undefined,
    popupBounds: undefined,
    reassign: undefined,
}

let PopupWindow = class {
    constructor () {
        if (!PopupWindow.instance) {
            PopupWindow.instance = this;
        } else {
            return PopupWindow.instance
        }
        let display = chrome.system.display.getInfo();
        display.then((value) => {
            this.workArea.height = value[0].workArea.height;
            this.workArea.width = value[0].workArea.width;
        });
        this.workArea = {
            height: 0,
            width: 0,
        }
        this.bounds = {};
        this.#getBounds();
    }

    windowData = () => {
        const width = () => {
            if (Options.isSaveSizePopup === false || Options.isSaveSizePopup === undefined) {
                if (Options.defaultPopup) {
                    return Options.defaultPopup.width;
                } 
            }
            if (Object.keys(this.bounds).length > 0) {
                return this.bounds.width;
            }
            return 380;
        }
        const height = () => {
            if (Options.isSaveSizePopup === false || Options.isSaveSizePopup === undefined) {
                if (Options.defaultPopup) {
                    return Options.defaultPopup.height;
                } 
            }
            if (Object.keys(this.bounds).length > 0) {
                if (this.bounds.isTrackListOpen) {
                    return this.bounds.playlistHeight;
                }
                return this.bounds.height;
            }
            return 580;
        }
        const left = () => {
            if(this?.bounds?.left) return this.bounds.left;
            return this.workArea.width / 2 - width() / 2; 
        }
        const top = () => {
            if (this?.bounds?.top) return this.bounds.top;
            return this.workArea.height / 2 - height() / 2; 
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
            return new Promise((resolve) => {
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
        return new Promise((resolve) => {
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
        return new Promise((resolve) => {
            chrome.windows.getAll({ populate: true, windowTypes: ['popup'] }).then((result) => {
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
                    resolve(false);
                }
            });
        });
    }
     #getBounds() {
        if (Options.popupBounds) {
            PopupWindow.instance.bounds = Options.popupBounds;
            return Options.popupBounds;
        }
        return new Promise((resolve) => {
            getOptions("popupBounds").then((result) => {
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
            getOptions("popupBounds", "reassign").then((result) => {
                if (Options.reassign?.isReassign) { 
                    if (Options.reassign.shortCut.name == command) {
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
            } else {
                getOptions().then((result) => {
                    showNotification(request);
                });
            }
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
            getYandexMusicTab().then((tabId) => {
                if (tabId) {
                    sendEvent({ id: chrome.runtime.id, tabId });
                    Options.pinTab && chrome.tabs.update(tabId, { pinned: true });
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
                    sendResponse({ options: result });
                });
            }
            // return;
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
        return true;  
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
    if (Background.connection.isConnected) {
        Background.connection.port.postMessage(event);
    }
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
    PopupWindow.instance.bounds = popupBounds;
    if (equalsObj(popupBounds, Options.popupBounds) == false) {
        if (force) {
            clearTimeout(writePopupBoundsTimer);
            writeOptions({ popupBounds });
            return;
        }
        clearTimeout(writePopupBoundsTimer);
        Options.popupBounds = popupBounds;
        writePopupBoundsTimer = setTimeout(() => {
            writeOptions({ popupBounds });
        }, 15000);
    }
}
// send to get frame
let createUpdatePopup = async() => {
    if (typeof(popupWindow) == 'undefined') {
        popupWindow = new PopupWindow();
    }
    const result = await popupWindow.create();
    if (result.exists && result.nowCreated) {
        sendMessage({ popupCreated: true, windowData: popupWindow.bounds });
    } else if (result.exists) {
        popupWindow.updateWindow();
    }
    return Promise.resolve(result);
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

let readOption = (options = null) => { 
    if (options !== null && typeof options !== 'string' && Array.isArray(options) !== true) {
        throw new TypeError(`Wrong options type. '${options}'`);
    }
    let existingOptions = [];
    if (options !== null) {
        if (Array.isArray(options)) {
            existingOptions = Object.keys(Options).filter((key) => {
                for (requestKey of options) { 
                    if (requestKey === key) return requestKey;
                 }
            });
        } else if (typeof options === "string") {
            existingOptions = Object.keys(Options).filter(option => option === options);
        }
        if (existingOptions.length == 0) {
            throw new Error(`The '${options}' does not exsist`);
        }
    }
    const date = new Date();
    Background.lastReaded.time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

    return new Promise((resolve) => {
        const optionsToGet = existingOptions.length > 0 ? existingOptions : null;
        if(optionsToGet === null) Background.isAllReaded = true;
        chrome.storage.local.get(optionsToGet).then(result => {
            Object.keys(result).forEach((key) => Options[key] = result[key]);

            if (optionsToGet !== null && Object.keys(result).length !== existingOptions.length) {
                const emptyOptions = existingOptions.reduce((options, key) => {
                    return Object.assign(options, { [key]: undefined });
                }, {});

                const missingOptions = existingOptions.filter((value) => result[value] ? false : true);
                result = Object.defineProperty({ ...emptyOptions, ...result }, "Info", {
                    value: `The '${missingOptions.join(", ")}' probably not writed yet`
                });

                resolve(result);
                return;
            }
            resolve(result);
        });
    });
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

const checkNewVersion = async () => {
    const manifestVersion = chrome.runtime.getManifest().version; // this
    if (Options.version === undefined && Background.isAllReaded === false) {
        await getOptions("version");
    }
    if (manifestVersion != Options.version) {
        const result = await getWhatNew();
        if (!result.success) { return; }
        let currentVersionDescription = result.versions[0][0];
        if (Options.oldVersionDescription != currentVersionDescription) {
            writeOptions({
                version: manifestVersion,
                oldVersionDescription: currentVersionDescription,
                isShowWhatNew: true
            });
        }
        return Promise.resolve({ isNewVersion: true });
    }
    return Promise.resolve({ isNewVersion: false });
}
/**
 * option takes parameters.
 * @param {null | string[] | string} option null for get all options,
 *  get needed ["theme", "version"] or "popupBounds".
 * @param {boolean} send force send message with options.
 * @return {object} Result as object.
 */
let getOptions = async (option = null, send = false) => { // read and send
    if (option !== null && typeof option !== 'string' && Array.isArray(option) !== true) {
        throw new TypeError(`Wrong option type. ${option}`);
    }
    return new Promise((resolve, reject) => {
        readOption(option).then((result) => { // read from parameter
            if (option === null && result.isShowWhatNew) {
                sendMessage({ options: Options });
            }
            if (send) sendMessage({ options: Options });
            resolve(result);
        }, (rejected) => {
            reject(rejected);
            console.log("Read settings error.", rejected);
        });
    });
}

let popupWindow = new PopupWindow();
Background.connection.create();
checkNewVersion();