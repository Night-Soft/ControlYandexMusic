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
    skipLike: undefined,
    pinTab: undefined,
    positionStep: undefined,
    volumeStep: undefined,
    isAllNoifications: undefined,
    isPlayPauseNotify: undefined,
    isPrevNextNotify: undefined,
    isNewFeaturesShown: undefined,
    version: undefined,
    oldVersionDescription: undefined,
    theme: undefined,
    isDislikeButton: undefined,
    isSaveSizePopup: true,
    saveInfo: undefined,
    popupBounds: undefined,
    reassign: undefined,
    isOpenInCurrentTab: undefined,
    lastDownload: undefined,
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
            left: Math.round(left()),
            top: Math.round(top()),
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

function checkCommand(command) {
    if (Options.reassign?.isReassign && Options.reassign.shortCut.name == command) {
        createUpdatePopup();
        return;
    }
    
    if (command === "toggleLike-key" && Options.skipLike?.is && currentTrack.liked) {
        if (Options.skipLike.isRepeat === false) return;

        if (canRemoveLike === false) {
            skipLikeNotify();
            return;
        }    
    }

    sendEvent({ commandKey: command, key: true });
}

let skipLikeId, canRemoveLike = false;
function skipLikeNotify(isOnlyNotification) {
    const time = Number(Options.skipLike.time) * 1000;
    const notification = {
        title: `'${currentTrack?.title}'${chrome.i18n.getMessage("alreadyInFavorites")}`,
        message: isOnlyNotification ? "" : chrome.i18n.getMessage("againToRemove"),
        iconUrl: chrome.runtime.getURL("../img/icon.png"),
    }

    createNotification(notification);
    
    if (isOnlyNotification) return;

    clearTimeout(skipLikeId);
    canRemoveLike = true;
    skipLikeId = setTimeout(() => {
        canRemoveLike = false;
        chrome.notifications.clear("YandexMusicControl");
    }, time);
}

chrome.commands.onCommand.addListener(function (command) {
    //'next-key', 'previous-key', 'togglePause-key', 'toggleLike-key'
    if (Options.reassign === undefined || Options.skipLike === undefined) {
        getOptions("popupBounds", "reassign", "skipLike").then(() => checkCommand(command));
        return;
    }

    checkCommand(command);
});

const getCover = (url) => {
    if (url === undefined) return chrome.runtime.getURL("../img/icon.png");
    
    url = "https://" + url
    url = url.slice(0, -2);
    url += Options.saveInfo.coverSize;

    return url;
}

let lastDownload = {
    txt: {
        time: null,
        id: null
    },
    jpg: {
        time: null,
        id: null
    }
};

const downloadTrackInfo = async (url, type) => {
    try {
        let filename;
        switch (type) {
            case ".jpg":
                filename = Options.saveInfo.nameJpg + type;
                const img = (await (await fetch(url)).blob());
                const imgBase64 = await getImgBase64(img);

                if (imgBase64.includes("image/png")) {
                    const jpgBlob = await convertPngToJpg(img);
                    url = await getImgBase64(jpgBlob);
                } else {
                    url = imgBase64;
                }
                break;
            case ".txt":
                filename = Options.saveInfo.nameTxt + type;
                break;
            default:
                throw new Error(`Incorrect file type: ${type}`);
        }

        const lastD = lastDownload[type.substring(1)];
        const id = await chrome.downloads.download({
            url, filename, conflictAction: "overwrite"
        });
        if (lastD.id != null) await chrome.downloads.erase({ id: lastD.id });
        lastD.id = id;
        lastD.time = Date.now();

    } catch (error) {
        console.warn(error);
    }
}

let isSaveInfoReaded = false;
let prevCoverUrl = null;
const checkSaveInfo = async (progress) => {
    if(Object.keys(currentTrack).length === 0) return;
    
    if (isSaveInfoReaded === false) {
        isSaveInfoReaded = true;

        chrome.downloads.setUiOptions({ enabled: false });

        const result = await getOptions("saveInfo", "lastDownload");
        const { txt, jpg } = result;
        if (typeof txt?.id === "number") {
            const [dItem] = await chrome.downloads.search({ id: txt.id });
            if (dItem) lastDownload.txt.id = id;

        }
        if (typeof jpg?.id === "number") {
            const [dItem] = await chrome.downloads.search({ id: jpg.id });
            if (dItem) lastDownload.jpg.id = id;
        }
    }

    if (Options.saveInfo?.isSave) {
        let info = [];
        if (Options.saveInfo.isTrackArtist) {
            let trackArtist = currentTrack.title + " " + getArtists(currentTrack);
            info.push(trackArtist);
        }
        if (Options.saveInfo.isCurrnetTime && progress) {
            let position = getDurationAsString(progress.position);
            let duration = getDurationAsString(progress.duration);
            info.push(`${position} ${duration}`);
        }

        if (Options.saveInfo.isSaveCover) {
            const url = getCover(currentTrack.cover);
            if (prevCoverUrl != url) {
                prevCoverUrl = url;
                downloadTrackInfo(url, ".jpg");
            }
        }

        if (info.length > 0) {
            const url = 'data:attachment/text,' + encodeURI(info.join("\n"));
            downloadTrackInfo(url, ".txt");
        }
    }
}

chrome.downloads.onErased.addListener((id) => {
    if (id === lastDownload.txt.id) lastDownload.txt.id = null;
    if (id === lastDownload.jpg.id) lastDownload.jpg.id = null;
});

chrome.runtime.onSuspend.addListener(() => {
    writeOptions({ lastDownload });
});

let lastSaveProgress = 0;
let currentTrack = {};
chrome.runtime.onMessageExternal.addListener(
    function(request) {
        if (request.changeTrack || request.key) {
            showNotification(request);
        }
        if (request.event === "currentTrack") {
            currentTrack = request.currentTrack;
            if (currentTrack?.changeTrack) checkSaveInfo();
        }
        if (request.event === "toggleLike") {
            currentTrack.liked = request.isLiked;
        }
        if (request.event === "CONTROLS") {
            currentTrack.liked = request.liked;
            currentTrack.disliked = request.disliked;
        }
        if (request.event === "PROGRESS") {
            const now = Date.now();
            if (now - lastSaveProgress >= 1000) {
                lastSaveProgress = now;
                checkSaveInfo(request.progress);
            }
        }
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
                sendResponse({ options: Options });
            } else {
                getOptions().then((result) => {
                    sendResponse({ options: result });
                });
            }
        } else if (request.getOptions != undefined) {
            getOptions(request.getOptions).then((result) => {
                sendMessage({ options: result });
            });
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

let host = ["https://music.yandex", "https://next.music.yandex"];
let getYandexMusicTab = () => {
    return new Promise(function(resolve, reject) {
        chrome.tabs.query({
            windowType: "normal"
        }, function(tabs) {
            for (let i = tabs.length - 1; i >= 0; i--) {
                let url = tabs[i].url;
                if (url.startsWith(host[0]) || url.startsWith(host[1])) {
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

const getImgBase64 = async (imgBlob) => {
    return new Promise((resolve,reject) => {
        const reader = new FileReader();
        reader.onloadend = () => { resolve(reader.result) };
        reader.onerror = reject;
        reader.onabort = reject;
        reader.readAsDataURL(imgBlob);
    });
}

const convertPngToJpg = async (imgBlob) => {
    const size = Number(Options.saveInfo.coverSize.split("x")[0]);

    let canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const img = await createImageBitmap(imgBlob);

    ctx.drawImage(img, 0, 0);
    return await canvas.convertToBlob({ type: 'image/jpeg', quality: 1 }); 
}

let roundedImage = async (imageUrl) => {
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
    const blobImg = await canvas.convertToBlob().catch(() => null);

    if (blobImg) return { url: await getImgBase64(blobImg), isBase64: true }

    return { url: "../img/icon.png", isBase64: false } 
}

let showNotification = async(request) => {
    let nameArtists = getArtists(request.currentTrack);
    let nameTrack = request.currentTrack.title;
    let iconTrack = request.currentTrack.cover;
    let isLike = request.currentTrack.liked;
    let isDislike = request.currentTrack.disliked;
    // get options
    if (Background.isAllReaded == false || Background == undefined) {
        await getOptions("isAllNoifications", "isPlayPauseNotify", "isPrevNextNotify");
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
            if (isLike) {
                iconTrack = "../img/liked.png";
                nameArtists = liked;
            } else {
                iconTrack = "../img/not-liked.png";
                nameArtists = disliked;
            }
            setNotifications(nameTrack, nameArtists, iconTrack)
            return;

        case 'toggleDislike-key':
            if (isDislike) { 
                iconTrack = "../img/disliked.png";
                nameArtists =  chrome.i18n.getMessage("addedToBlackList");
            } else {
                iconTrack = "../img/dislike.png";
                nameArtists = chrome.i18n.getMessage("removeFromBlackList");
            }
            setNotifications(nameTrack, nameArtists, iconTrack)
            return;
    }

    if (Options.isAllNoifications == true) {
        setNotifications(nameTrack, nameArtists, iconTrack);
        return;
    }
}

let lastUrl, lastBase64Url;
let setNotifications = async(trackTitle, trackArtists, iconTrack) => {
    if (iconTrack == undefined) {
        iconTrack = chrome.runtime.getURL("../img/icon.png");
    } else {
        if (iconTrack.startsWith("../") == false) {
            if (lastUrl != iconTrack) {
                lastUrl = iconTrack;
                await roundedImage(iconTrack).then((result) => {
                    iconTrack = result.url;
                    lastBase64Url = result.url;
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

    createNotification({
        title: trackTitle,
        message: trackArtists,
        iconUrl: iconTrack,
        eventTime: Date.now()
    });
}

let lastEventTime = 0;
const createNotification = (notification) => {
    chrome.notifications.getAll((notifications) => {
        const now = Date.now();
        const isNotification = Object.keys(notifications).length > 0;
        const isTimeOut = now - lastEventTime > 10_000;
       
        lastEventTime = now;

        if (!isNotification || isTimeOut) {
            chrome.notifications.clear("YandexMusicControl");
            chrome.notifications.create("YandexMusicControl", { type: "basic", ...notification });
        } else {
            chrome.notifications.update("YandexMusicControl", notification);
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
    if (Array.isArray(options) && options.length === 0) options = null;

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
    Object.keys(option).forEach((key) => {
        if (Options.hasOwnProperty(key)) {
            Options[key] = option[key];
            chrome.storage.local.set({ [key]: option[key] });
        }
    });
}

let splitSeconds = (currentSeconds) => {
    const timeUnits = [3600, 60, 0]; // hours, minutes, seconds
    const time = [];
    timeUnits.forEach((value) => {
        if (value == 0) {
            time.push(Math.floor(currentSeconds));
            return;
        }
        if (currentSeconds / value >= 1) {
            time.push(Math.floor(currentSeconds / value));
            currentSeconds = currentSeconds - (time[time.length - 1] * value);
        } else {
            time.push(0);
        }
    });

    return { hours: time[0], minutes: time[1], seconds: time[2] }
}

/** 
* @param {...number} time - seconds, minutes, hours.
* Time units must be number.
*/
let twoDigits = function (...args) {
    const formatedTime = args.map((value, index) => {
        if (index === 0 && value === 0) return "00";
        return value < 10 ? "0" + value : value;
    });
    if (formatedTime.length == 1) { formatedTime.push("00") }
    if (formatedTime.length == 0) return "00:00";
    return formatedTime.reverse().join(":");
}

let getDurationAsString = (duration = 0) => {
    const { seconds, minutes, hours } = splitSeconds(duration);
    return hours > 0 ? twoDigits(seconds, minutes, hours) : twoDigits(seconds, minutes);
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
                isNewFeaturesShown: true
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
 * @return {object} Result as object.
 */
let getOptions = async (...option) => {
    if (option !== null && typeof option !== 'string' && Array.isArray(option) !== true) {
        throw new TypeError(`Wrong option type. ${option}`);
    }
    return new Promise((resolve, reject) => {
        readOption(option).then((result) => { // read from parameter
            if (option === null && result.isNewFeaturesShown) {
                sendMessage({ options: Options });
            }
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