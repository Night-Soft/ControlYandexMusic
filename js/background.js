chrome.commands.onCommand.addListener(function(command) {
    let cmd = command;
    switch (cmd) {
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
            let artists = request.currentTrack.artists;
            let nameArtists = "";
            for (let i = 0; i < artists.length; i++) {
                nameArtists += artists[i].title + ", ";
                if (i + 1 == artists.length) {
                    nameArtists = nameArtists.slice(-nameArtists.length, -2);
                }
            }
            let nameTrack = request.currentTrack.title;
            let iconTrack = request.currentTrack.cover;
            let isLike = request.currentTrack.liked;
            if (iconTrack == undefined) {
                iconTrack = "img/icon.png"
            } else {
                iconTrack = "https://" + iconTrack
                iconTrack = iconTrack.slice(0, -2);
                iconTrack += "200x200";
                urlCover = iconTrack;
            }
            if (Options.isPlayPauseNotify == true && Options.isPrevNextNotify == true) {
                switch (request.dataKey) {
                    case 'next-key':
                        setNotifications(nameTrack, nameArtists, iconTrack);
                        break;
                    case 'previous-key':
                        setNotifications(nameTrack, nameArtists, iconTrack);
                        break;
                    case 'togglePause-key':
                        setNotifications(nameTrack, nameArtists, iconTrack)
                        break;
                    case 'toggleLike-key':
                        let liked = chrome.i18n.getMessage("liked");
                        let disliked = chrome.i18n.getMessage("disliked");
                        if (isLike) { // noGood
                            iconTrack = "img/like.png";
                            nameArtists = liked;
                        } else {
                            iconTrack = "img/disliked.png";
                            nameArtists = disliked;

                        }
                        setNotifications(nameTrack, nameArtists, iconTrack)
                        break;
                }
            } else if (Options.isPlayPauseNotify == true && Options.isPrevNextNotify == false) {
                switch (request.dataKey) {
                    case 'togglePause-key':
                        setNotifications(nameTrack, nameArtists, iconTrack)
                        break;
                    case 'toggleLike-key':
                        let liked = chrome.i18n.getMessage("liked");
                        let disliked = chrome.i18n.getMessage("disliked");
                        if (isLike) { // noGood
                            iconTrack = "img/like.png";
                            nameArtists = liked;
                        } else {
                            iconTrack = "img/disliked.png";
                            nameArtists = disliked;

                        }
                        setNotifications(nameTrack, nameArtists, iconTrack)
                        break;
                }
            } else if (Options.isPlayPauseNotify == false && Options.isPrevNextNotify == true) {
                switch (request.dataKey) {
                    case 'next-key':
                        setNotifications(nameTrack, nameArtists, iconTrack);
                        break;
                    case 'previous-key':
                        setNotifications(nameTrack, nameArtists, iconTrack);
                        break;
                    case 'toggleLike-key':
                        let liked = chrome.i18n.getMessage("liked");
                        let disliked = chrome.i18n.getMessage("disliked");
                        if (isLike) { // noGood
                            iconTrack = "img/like.png";
                            nameArtists = liked;
                        } else {
                            iconTrack = "img/disliked.png";
                            nameArtists = disliked;

                        }
                        setNotifications(nameTrack, nameArtists, iconTrack)
                        break;
                }
            }
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
            sendResponse({
                options: Options
            });
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

let timer;

function setNotifications(trackTitle, trackArtists, iconTrack) {
    if (iconTrack == undefined) {
        iconTrack = "img/icon.png"
    }
    chrome.notifications.create("YandexMusicControl", {
        type: "basic",
        title: trackTitle,
        message: trackArtists,
        iconUrl: iconTrack
    }, function(callback) {
        function out() {
            timer = setTimeout(function() {
                chrome.notifications.clear("YandexMusicControl");
            }, 7000);
        }
        clearTimeout(timer);
        out();

    });
}

chrome.notifications.onClicked.addListener((YandexMusicControl) => {
    sendEvent('next-key', true);

});

let Options = {
    isPlayPauseNotify: undefined,
    isPrevNextNotify: undefined,
    isShowWhatNew: undefined,
    version: undefined,
    oldVersionDescription: undefined
}

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

const manifestVersion = chrome.runtime.getManifest().version;

function getOptions(option = { all: true }) { // read and send
    readOption(option).then((result) => { // read from parameter
        let date = new Date();
        console.log("parameter readed", result, "time:", date.getHours(), ":", date.getMinutes(), ":", date.getSeconds());
        //sendMessage({ options: result });
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

    }, (reject) => {
        console.log("Read settings error.", reject);
    });
}

//getOptions({ paramter: ["innewversion", "version"] });
getOptions();