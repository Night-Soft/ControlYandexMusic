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
            getKey().then((value) => {
                if (isPlayPuaseNotify == true && isPrevNextNotify == true) {
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
                } else if (isPlayPuaseNotify == true && isPrevNextNotify == false) {
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
                } else if (isPlayPuaseNotify == false && isPrevNextNotify == true) {
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
            });


        }
    });
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.backgroundMessage == "background") {
            setNotifications(request.name, request.artists, request.imageUrl);
        }
        if (request.loading == true) {
            firstLoad(request.activeTab);
        }
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

let isPrevNextNotify = true;
let isPlayPuaseNotify = true;

function getKey() {
    return new Promise(function(resolve, reject) {
        chrome.storage.local.get(['key1'], function(result) {
            isPlayPuaseNotify = result.key1
        });
        chrome.storage.local.get(['key2'], function(result) {
            isPrevNextNotify = result.key2
            resolve("resolve");
        });
    });

}