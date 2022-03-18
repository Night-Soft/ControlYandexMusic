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
    });
let send;
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request);

        if (request.backgroundMessage == "background") {
            setNotifications(request.name, request.artists, request.imageUrl);
        }
        if (request.loading != undefined) {
            firstLoad(request.activeTab);
        }
        if (request.getId != undefined) {
            let extId = chrome.runtime.id;
            sendResponse({ id: extId });
        }
        if (request.getOptions == "all") {
            sendResponse({ options: Options });
            return;
        }
        if (request.getOptions != undefined) {
            getOptions(request.getOptions);
        }
        if (request.writeOptions != undefined) {
            writeOptions(request.options);
            //updateOptions(request.options);
            //sendResponse(Options);
        }
        sendResponse({ connect: true });
    });

let firstLoad = (activeTab) => {
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if (changeInfo.status == 'complete') {
            sendFirstLoad(tab.id);
        }
    });
}

function sendFirstLoad(activeTab) {
    chrome.runtime.sendMessage({ uploaded: true, activeTab: activeTab });

}
let sendMessage = (event) => {
    chrome.runtime.sendMessage(event);
}

function sendEvent(event, isKey) {
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
let readOptions = (option) => {
    return new Promise((resolve, reject) => {
        //let Options = {}
        chrome.storage.local.get(['key1'], function(result) {
            Options.isPlayPauseNotify = result.key1;

        });
        chrome.storage.local.get(['key2'], function(result) {
            Options.isPrevNextNotify = result.key2;
        });
        chrome.storage.local.get(['version'], function(result) {
            Options.version = result.version;
        });
        chrome.storage.local.get(['innewversion'], function(result) {
            Options.innewversion = result.innewversion;
            resolve(Options);
            //setOptions(Options);
            //Options = Object.assign(options);

        });
    });
}
let Options = {
    isPlayPauseNotify: undefined,
    isPrevNextNotify: undefined,
    version: undefined,
    innewversion: undefined
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
        chrome.storage.local.set({
            //[option.isPlayPauseNotify]: option.isPlayPauseNotify
        });
    }
    if (option.isPrevNextNotify != undefined) {
        chrome.storage.local.set({
            isPrevNextNotify: option.isPrevNextNotify
        });
    }
    if (option.version != undefined) {
        chrome.storage.local.set({
            version: manifestData.version
                //Options.version
        });
    }
    if (option.innewversion != undefined) {
        chrome.storage.local.set({
            innewversion: inCurrentVersion
                //Options.innewversion
        });
    }
    // chrome.storage.local.set({ key1: playPauseNotify.checked });
    // chrome.storage.local.set({ key2: prevNextNotify.checked });
    // chrome.storage.local.set({ version: manifestData.version }); // set new version
    // chrome.storage.local.set({ innewversion: inCurrentVersion }); // set text what new
}
let setOptions = (options) => {
    // console.log("assign ", Options);
}

function getOptions(option = { all: true }) { // read and send
    readOption(option).then((result) => { // read from parameter
        console.log("parameter readed", result);
        //console.log("Object.keys", Object.keys(result));
        if (option.response) {
            sendMessage({ options: result });
        }
        //sendMessage({ options: result });
    }, (reject) => {
        console.log("Settings readed error.", reject);
    });
}
getOptions();
// writeOptions({
//     isPlayPauseNotify: false,
//     isPrevNextNotify: true,
// });