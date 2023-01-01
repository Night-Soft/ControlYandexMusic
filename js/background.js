let PopupWindow = class {
    constructor() {
        if (!PopupWindow.instance) {
            PopupWindow.instance = this;
        } else {
            return PopupWindow.instance
        }
        let display = chrome.system.display.getInfo();
        display.then((value) => {
            this.screenWorkArea.height = value[0].workArea.height;
            this.screenWorkArea.width = value[0].workArea.width;
        }, (reject) => {});
        this.width = 250;
        this.height = 110;
        this.screenWorkArea = {
            height: 0,
            width: 0,
        }
        this.bounds = undefined;
        PopupWindow.checkCreated();
        PopupWindow.getBounds();
    }
    get left() {
        return this.screenWorkArea.width - this.width
    }
    get top() {
        return this.screenWorkArea.height - this.height
    }
    windowData = {
        get height() {
            if (PopupWindow.instance.bounds != undefined && Object.keys(PopupWindow.instance.bounds).length !== 0) {
                return PopupWindow.instance.bounds.height;
            }
            return PopupWindow.instance.height;
        },
        get width() {
            if (PopupWindow.instance.bounds != undefined && Object.keys(PopupWindow.instance.bounds).length !== 0) {
                return PopupWindow.instance.bounds.width;
            }
            return PopupWindow.instance.width;
        },
        get left() {
            if (PopupWindow.instance.bounds != undefined && Object.keys(PopupWindow.instance.bounds).length !== 0) {
                return PopupWindow.instance.bounds.left;
            }
            return PopupWindow.instance.left
        },
        get top() {
            if (PopupWindow.instance.bounds != undefined && Object.keys(PopupWindow.instance.bounds).length !== 0) {
                return PopupWindow.instance.bounds.top;
            }
            return PopupWindow.instance.top
        },
        focused: true,
        type: "popup",
        url: "../popup.html"
    }
    create(force = false) {
        if (force) {
            chrome.windows.create(this.windowData, (windowData) => {
                this.bounds = windowData;
                return {
                    isCreated: true,
                    exists: true,
                    message: "The window was successfully created!",
                    popupWindow: windowData
                };
            });
        }
        return new Promise((resolve, reject) => {
            PopupWindow.checkCreated().then((result) => {
                if (result == false) { // 0 - The window already exists!
                    chrome.windows.create(this.windowData, (windowData) => {
                        this.bounds = windowData;
                        resolve({
                            isCreated: true,
                            exists: true,
                            message: "The window was successfully created!",
                            popupWindow: windowData
                        });
                    });
                } else {
                    resolve({
                        isCreated: false,
                        exists: true,
                        message: "The window already exists!",
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
                } else {
                    //this.bounds = undefined;
                    resolve(false);
                }
            }, (reject) => {});
        });
    }
    static getBounds() {
        if (Options.popupBounds) {
            PopupWindow.instance.bounds = Options.popupBounds;
            return Options.popupBounds;
        }
        return new Promise((resolve, reject) => {
            getOptions({ parameters: ["popupBounds"] }).then((result) => {
                console.log("result", result)
                PopupWindow.instance.bounds = result.popupBounds;
                resolve(result);
            });
        });
    }
}
let keyOpenPage = false;
chrome.commands.onCommand.addListener(function(command) {
    if (command) { // 'next-key' 'previous-key' 'togglePause-key' 'toggleLike-key'
        if (Options.reassign == undefined) {
            getOptions({ parameters: ["popupBounds", "reassign"] }).then((result) => {
                if ("isReassign" in Options.reassign) {
                    if (Options.reassign.isReassign == true && Options.reassign.shortCut.name == command) {
                        openUpdatePopup();
                        return;
                    }
                }
            });
        } else {
            if (Options.reassign.isReassign == true && Options.reassign.shortCut.name == command) {
                openUpdatePopup();
                return;
            } else {
                sendEvent({ commandKey: command, key: true });
            }
        }
    }
});

chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        console.log("onMessageExternal", request);
        if (request.eventTrack && Options.isAllNoifications) {
            showNotification(request);
            return;
        }
        if (request.key == true) {
            if (State.isAllReaded) {
                showNotification(request);
            } else(
                getOptions().then((result) => {
                    showNotification(request);
                }, (rejected) => {})
            )
        }
        //return true;
    });

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log("onMessage", request);
        if (request.backgroundMessage == "background") {
            setNotifications(request.name, request.artists, request.imageUrl);
        }
        if (request.getId != undefined) {
            chrome.tabs.query({ windowType: "normal" }, function(tabs) {
                for (let i = tabs.length - 1; i >= 0; i--) {
                    if (tabs[i].url.startsWith("https://music.yandex")) {
                        activeTab = tabs[i].id;
                        chrome.tabs.sendMessage(tabs[i].id, { id: chrome.runtime.id, tabId: tabs[i].id });
                        break;
                    }
                }
            });
        }
        if (request.getOptions == true) {
            if (State.isAllReaded) {
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
                // console.log(request)
                getOptions(request.getOptions, request.send);
            } else {
                getOptions(request.getOptions);
            }
        }
        if (request.writeOptions != undefined) {
            writeOptions(request.options);
        }
        if (request.popupBounds != undefined) {
            writePopupBounds(request);
            console.log(request.popupBounds);
        }
        if (request.createPopup) {
            openUpdatePopup().then((result) => {
                sendResponse(result);
            });
        }
        //return true; // 
    });
chrome.windows.onRemoved.addListener((ev) => {
    if (ev == popupWindow.bounds.id) {
        try {
            delete popupWindow.bounds.id;
            delete popupWindow.bounds.tabs;
            delete popupWindow.bounds.focused;
            delete popupWindow.bounds.state;
            delete popupWindow.bounds.incognito;
            delete popupWindow.bounds.alwaysOnTop;

            delete Options.popupBounds.id;
            delete Options.popupBounds.tabs;
            delete Options.popupBounds.focused;
            delete Options.popupBounds.state;
            delete Options.popupBounds.incognito;
            delete Options.popupBounds.alwaysOnTop;
        } catch (error) {}
        writePopupBounds({ popupBounds: PopupWindow.instance.bounds }, true);
        console.log("will write from removed", ev);
    }
})
let sendMessage = (event, callback) => {
    chrome.runtime.sendMessage(event, callback);
}

function sendEvent(event = {}, isKey) { // to content script
    let activeTab;
    chrome.tabs.query({ windowType: "normal" }, function(tabs) {
        for (let i = tabs.length - 1; i >= 0; i--) {
            if (tabs[i].url.startsWith("https://music.yandex")) {
                activeTab = tabs[i].id;
                break;
            }
        }
        chrome.tabs.sendMessage(activeTab, event);
    });
}
let writePopupBoundsTimer;
let writePopupBounds = (popupBounds, force = false) => {
    PopupWindow.instance.bounds = popupBounds.popupBounds;
    console.log("save to instance");
    if (Options.isSavePosPopup) {
        if (equalsObj(popupBounds.popupBounds, Options.popupBounds) == false) {
            if (force) {
                clearTimeout(writePopupBoundsTimer);
                writeOptions(popupBounds);
                console.log("popupBounds saved force");
                return;
            }
            if (typeof(writePopupBoundsTimer) != "undefined") {
                clearTimeout(writePopupBoundsTimer);
                console.log("timer clear", writePopupBoundsTimer);
            }
            writePopupBoundsTimer = setTimeout(() => {
                writeOptions(popupBounds);
                console.log("popupBounds saved");
            }, 15000);
        } else {
            console.log("Objects is the same", popupBounds.popupBounds, Options.popupBounds);
        }
    }
}

let openUpdatePopup = async() => {
    if (typeof(popupWindow) == 'undefined') {
        popupWindow = new PopupWindow();
    }
    return new Promise((resolve, reject) => {
        popupWindow.create().then((result) => {
            // if (keyOpenPage == true) {
            //     sendMessage({ keyOpenPage: true });
            //     keyOpenPage = false;
            //     return;
            // }
            if (result.exists && result.isCreated) {
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
        // get from posdcast
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
        return;
    } else {
        imageUrl = "https://" + imageUrl
        imageUrl = imageUrl.slice(0, -2);
        imageUrl += size + "x" + size;
    }
    console.log(imageUrl)

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
    var ctx = canvas.getContext('2d');
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
        console.log(blob);
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
let lastUrl, lastBase64Url;
let showNotification = async(request) => {
    console.log("request", request);
    let nameArtists = getArtists(request.currentTrack);
    let nameTrack = request.currentTrack.title;
    let iconTrack = request.currentTrack.cover;
    let start = this.performance.now();
    if (lastUrl != iconTrack) {
        if (iconTrack == "../img/icon.png") { return; }
        await roundedImage(iconTrack).then((result) => {
            iconTrack = result.base64Url;
            lastBase64Url = result.base64Url;
        });
    } else {
        if (typeof(lastBase64Url) != "undefined") {
            iconTrack = lastBase64Url;
        }
    }
    lastUrl = request.currentTrack.cover;
    let end = this.performance.now();
    console.log("timeOfgetBlob", Number.parseFloat(end - start).toPrecision(5));
    let isLike = request.currentTrack.liked;
    if (Options.isAllNoifications == true) {
        setNotifications(nameTrack, nameArtists, iconTrack)
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
                iconTrack = "../img/disliked.png";
                nameArtists = disliked;
            }
            setNotifications(nameTrack, nameArtists, iconTrack)
            break;
    }

}

function setNotifications(trackTitle, trackArtists, iconTrack) {
    if (iconTrack == undefined) {
        iconTrack = chrome.runtime.getURL("../img/icon.png");
    }
    chrome.notifications.create("YandexMusicControl", {
        type: "basic",
        title: trackTitle,
        message: trackArtists,
        iconUrl: iconTrack
    }, function(callback) {
        setTimeout(function() {
            chrome.notifications.clear("YandexMusicControl");
        }, 7000);
    });
}

chrome.notifications.onClicked.addListener((YandexMusicControl) => {
    sendEvent({ commandKey: 'next-key', key: true });

});

let getWhatNew = async() => {
    let response = fetch("../whatNew.json");
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
let State = {
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
    isCoverIncrease: undefined,
    isDislikeButton: undefined,
    isSavePosPopup: undefined,
    popupBounds: undefined,
    reassign: undefined
}

let readOption = (option) => {
    console.log("readOption", option);
    let date = new Date();
    State.lastReaded.time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    if (option == true) { // get all options
        return new Promise((resolve, reject) => {
            let OptionsKeys = Object.keys(Options);
            let obj = {}
            for (let i = 0; i < OptionsKeys.length; i++) {
                chrome.storage.local.get([OptionsKeys[i]], function(result) {
                    Options[OptionsKeys[i]] = result[OptionsKeys[i]];
                    obj[OptionsKeys[i]] = result[OptionsKeys[i]];
                    if (OptionsKeys.length - 1 == i) {
                        State.isAllReaded = true;
                        State.lastReaded.parameters = OptionsKeys;
                        resolve(obj);
                    }
                });
            }
        });
    }
    if (option.parameters) { // get selected options
        return new Promise((resolve, reject) => {
            let OptionsKeys = Object.keys(Options);
            let obj = {}
            for (let j = 0; j < option.parameters.length; j++) {
                for (let i = 0; i < OptionsKeys.length; i++) {
                    if (OptionsKeys[i].localeCompare(option.parameters[j]) == 0) {
                        chrome.storage.local.get([option.parameters[j]], function(result) {
                            Options[OptionsKeys[i]] = result[OptionsKeys[i]];
                            obj[OptionsKeys[i]] = result[OptionsKeys[i]];
                            if (option.parameters.length == Object.keys(obj).length) {
                                State.lastReaded.parameters = option.parameters;
                                resolve(obj);
                            }
                        });

                    }
                }
            }

        });
    }
}

let writeOptions = (option) => {
    if (option.isAllNoifications != undefined) {
        chrome.storage.local.set({ isAllNoifications: option.isAllNoifications });
        Options.isAllNoifications = option.isAllNoifications;
    }
    if (option.isPlayPauseNotify != undefined) {
        chrome.storage.local.set({ isPlayPauseNotify: option.isPlayPauseNotify });
        Options.isPlayPauseNotify = option.isPlayPauseNotify;
    }
    if (option.isPrevNextNotify != undefined) {
        chrome.storage.local.set({ isPrevNextNotify: option.isPrevNextNotify });
        Options.isPrevNextNotify = option.isPrevNextNotify;
    }
    if (option.isShowWhatNew != undefined) {
        chrome.storage.local.set({ isShowWhatNew: option.isShowWhatNew });
        Options.isShowWhatNew = option.isShowWhatNew;
    }
    if (option.version != undefined) {
        chrome.storage.local.set({ version: option.version });
        Options.version = option.version;
    }
    if (option.oldVersionDescription != undefined) {
        chrome.storage.local.set({ oldVersionDescription: option.oldVersionDescription });
        Options.oldVersionDescription = option.oldVersionDescription;
    }
    if (option.isDarkTheme != undefined) {
        chrome.storage.local.set({ isDarkTheme: option.isDarkTheme });
        Options.isDarkTheme = option.isDarkTheme;
    }
    if (option.isCoverIncrease != undefined) {
        chrome.storage.local.set({ isCoverIncrease: option.isCoverIncrease });
        Options.isCoverIncrease = option.isCoverIncrease;
    }
    if (option.isDislikeButton != undefined) {
        chrome.storage.local.set({ isDislikeButton: option.isDislikeButton });
        Options.isDislikeButton = option.isDislikeButton;
    }
    if (option.popupBounds != undefined) {
        chrome.storage.local.set({ popupBounds: option.popupBounds });
        Options.popupBounds = option.popupBounds;
    }
    if (option.isSavePosPopup != undefined) {
        chrome.storage.local.set({ isSavePosPopup: option.isSavePosPopup });
        Options.isSavePosPopup = option.isSavePosPopup;
    }
    if (option.reassign != undefined) {
        chrome.storage.local.set({ reassign: option.reassign });
        Options.reassign = option.reassign;
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

let port = chrome.runtime.connectNative('yandex.music.control');

port.onMessage.addListener(function(msg) {
    console.log("Received" + msg);
});
port.onDisconnect.addListener(function() {
    console.log("Disconnected");
});
port.postMessage({ text: "Hello, my_application" });