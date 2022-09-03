chrome.commands.onCommand.addListener(function(command) {
    switch (command) {
        case 'next-key':
            sendEvent('next-key', true);
            break;
        case 'previous-key':
            sendEvent('previous-key', true);
            break;
        case 'togglePause-key':
            sendEvent('togglePause-key', true);
            break;
        case 'toggleLike-key':
            sendEvent('toggleLike-key', true);
            break;
    }
});

chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        if (request.key == "key") {
            if (isReaded) {
                showNotification(request);
            } else(
                getOptions().then((result) => {
                    showNotification(request);
                }, (rejected) => {})
            )
        }
        return true;
    });

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.backgroundMessage == "background") {
            setNotifications(request.name, request.artists, request.imageUrl);
        }
        if (request.getId != undefined) {
            chrome.tabs.query({ windowType: "normal" }, function(tabs) {
                for (let i = tabs.length - 1; i >= 0; i--) {
                    if (tabs[i].url.startsWith("https://music.yandex")) {
                        activeTab = tabs[i].id;
                        chrome.tabs.sendMessage(tabs[i].id, { id: chrome.runtime.id });
                        break;
                    }
                }
            });
        }
        if (request.getOptions == "all") {
            if (isReaded) {
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
            getOptions(request.getOptions);
        }
        if (request.writeOptions != undefined) {
            writeOptions(request.options);
        }
        return true; // 
    });

let sendMessage = (event) => {
    chrome.runtime.sendMessage(event);
}

function sendEvent(event, isKey) { // to content script
    let activeTab;
    chrome.tabs.query({ windowType: "normal" }, function(tabs) {
        for (let i = tabs.length - 1; i >= 0; i--) {
            if (tabs[i].url.startsWith("https://music.yandex")) {
                activeTab = tabs[i].id;
                break;
            }
        }
        chrome.tabs.sendMessage(activeTab, { commandKey: event, key: isKey });
    });
}

let getArtists = (list, number = 3) => {
    let getArtistsTitle = (listArtists) => {
        let artists = "";
        for (let i = 0; i < number; i++) {
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

let showNotification = (request) => {
    let nameArtists = getArtists(request.currentTrack);
    let nameTrack = request.currentTrack.title;
    let iconTrack = request.currentTrack.cover;
    let isLike = request.currentTrack.liked;
    if (iconTrack == undefined) {
        iconTrack = "../img/icon.png"
    } else {
        iconTrack = "https://" + iconTrack
        iconTrack = iconTrack.slice(0, -2);
        iconTrack += "100x100";
        urlCover = iconTrack;
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
    sendEvent('next-key', true);

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

let isReaded = false;
let Options = {
    isPlayPauseNotify: undefined,
    isPrevNextNotify: undefined,
    isShowWhatNew: undefined,
    version: undefined,
    oldVersionDescription: undefined,

}

let readOption = (option) => {
    if (option.all) {
        return new Promise((resolve, reject) => {
            let OptionsKeys = Object.keys(Options);
            let obj = {}
            for (let i = 0; i < OptionsKeys.length; i++) {
                chrome.storage.local.get([OptionsKeys[i]], function(result) {
                    Options[OptionsKeys[i]] = result[OptionsKeys[i]];
                    obj[OptionsKeys[i]] = result[OptionsKeys[i]];
                    if (OptionsKeys.length - 1 == i) {
                        isReaded = true;
                        resolve(obj);
                    }
                });
            }
        });
    }
    if (option.paramter) {
        return new Promise((resolve, reject) => {
            let OptionsKeys = Object.keys(Options);
            let obj = {}
            for (let j = 0; j < option.paramter.length; j++) {
                for (let i = 0; i < OptionsKeys.length; i++) {
                    if (OptionsKeys[i].localeCompare(option.paramter[j]) == 0) {
                        chrome.storage.local.get([option.paramter[j]], function(result) {
                            Options[OptionsKeys[i]] = result[OptionsKeys[i]];
                            obj[OptionsKeys[i]] = result[OptionsKeys[i]];
                            if (option.paramter.length == Object.keys(obj).length) {
                                isReaded = true;
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
}

/**
 * option takes parameters.
 * @param {object} all True for get all options.
 * @param {object} paramter { paramter: ["innewversion", "version"] }.
 * @return {object} Result as object.
 */
let getOptions = async(option = { all: true }) => { // read and send
    return new Promise((resolve, reject) => {
        readOption(option).then((result) => { // read from parameter
            //let date = new Date();
            //console.log("parameter readed", result, "time:", date.getHours(), ":", date.getMinutes(), ":", date.getSeconds());
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
            resolve(result);
        }, (rejected) => {
            reject(rejected);
            console.log("Read settings error.", rejected);
        });
    });
}