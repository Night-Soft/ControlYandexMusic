chrome.commands.onCommand.addListener(function(command) {
    let cmd = command;
    switch (cmd) {
        case 'next-key':
            console.log("next success");
            pushEvent(cmd);
            sendEvent('next', true);
            break;
        case 'previous-key':
            console.log("previous success");
            pushEvent(cmd);
            sendEvent('previous', true);
            break;
        case 'play-key':
            console.log("pause success");
            pushEvent(cmd);
            sendEvent('pause', true);
            //setNotifications();
            break;
    }
    console.log('Command:', command);
    console.log('Command:', cmd);
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request)
        if (request.backgroundMessage == "background") {
            setNotifications(request.name, request.artists, request.imageUrl);
        }
        if (request.onload == true) {
            console.log("first load is")
            firstLoad(request.activeTab);
        }
    });

let firstLoad = (activeTab) => {
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        console.log('tab id = ' + tabId);
        console.log('activeTab = ' + activeTab);

        if (tabId == activeTab && changeInfo.status == 'complete') {
            console.log('load was ');
            sendFirstLoad();
            // do your things

        }
    });
}

function sendEvent(event, isKey) {
    let activeTab;
    chrome.tabs.query({ windowType: "normal" }, function(tabs) {
        for (let i = tabs.length - 1; i >= 0; i--) {
            console.log("tabs length = " + tabs.length);
            if (tabs[i].url.startsWith("https://music.yandex")) {
                console.log(tabs[i].url);
                console.log("current tab = " + i);
                activeTab = tabs[i].id;
                break;

            }

        }
        chrome.tabs.sendMessage(activeTab, { data: event, key: isKey }, function(response) {
            console.log('event is ' + event);

        });
    });
}

function sendFirstLoad() {
    let activeTab;
    chrome.tabs.query({ windowType: "normal" }, function(tabs) {
        for (let i = tabs.length - 1; i >= 0; i--) {
            console.log("tabs length = " + tabs.length);
            if (tabs[i].url.startsWith("https://music.yandex")) {
                console.log(tabs[i].url);
                console.log("current tab = " + i);
                activeTab = tabs[i].id;
                break;

            }

        }
        chrome.runtime.sendMessage({ onload: true });
    });
}

function setNotifications(trackTitle, trackArtists, iconTrack) {
    if (iconTrack == undefined) {
        iconTrack = "img/iconY.png"
    }
    chrome.notifications.create("YandexMusicControl", { type: "basic", eventTime: 700.0, title: trackTitle, message: trackArtists, iconUrl: iconTrack }, function(callback) {
        //chrome.notifications.clear("YandexMusicControl", function (callback){});
        timer = setTimeout(function() { chrome.notifications.clear("YandexMusicControl"); }, 7000);

    }); {

    }
}

//analytics

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-150296887-1']);
_gaq.push(['_trackPageview']);

(function() {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
})();
let pushEvent = (target) => {
    _gaq.push(['_trackEvent', target, 'background']);

}