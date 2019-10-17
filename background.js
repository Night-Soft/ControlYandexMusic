chrome.commands.onCommand.addListener(function(command) {
    let cmd = command;
    switch (cmd) {
        case 'next-key':
            console.log("next success");
            sendEvent('next', true);
            break;
        case 'previous-key':
            console.log("previous success");
            sendEvent('previous', true);
            break;
        case 'play-key':
            console.log("pause success");
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
    });


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
//work

// function sendEvent(event) {
//     //event = "pause";
//     chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
//         chrome.tabs.sendMessage(tabs[0].id, { data: event }, function(response) {
//             console.log('event is ' + event);

//         });
//     });
// }