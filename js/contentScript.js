chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.btn == true) { isBtn = true }
    if (request.key == true) { isKey = true }
    switch (request.data) {
        case 'previous':
            console.log("PREVIOUS");
            setPrevious();
            break;
        case 'pause':
            console.log("PAUSE");
            setPause();
            break;
        case 'next':
            console.log("NEXT");
            setNext();
            break;
        case 'event':
            console.log("EVENT");
            break;
        case 'extensionIsLoad':
            console.log("case = extensionIsLoad");
            getLike();
            getNameTrack();
            sendToPopup();
            break;
        case 'getPause':
            getPause();
            console.log("case = getPause");
            break;
        case 'like':
            getLike();
            setLike();
            console.log("case = Like");
            break;
        default:
            console.log('Sorry, we are out of ' + request.data + '.');
            break;
    }
    //console.log("something happening from the extension");
    var data = request.data || {};
    //sendResponse({ data: data, success: true });
    //console.log(request);

});
let onloadS = () => {

    }
    // let body = document.getElementsByTagName("body");
    // window.addEventListener("onload", function() {
    //     console.log('onload is window');
    //     chrome.runtime.sendMessage({ onload: "load" });
    // });
    // document.addEventListener("onload", function() {
    //     console.log('onload is document');
    //     chrome.runtime.sendMessage({ onload: "load" });
    // });
    // body.addEventListener("onload", function() {
    //     console.log('onload is document');
    //     chrome.runtime.sendMessage({ onload: "load" });
    // });        "run_at": "document_end",

console.log('why not load');




function setPrevious() {
    let previousTarget = document.getElementsByClassName("player-controls__btn_prev");
    let seconds = document.getElementsByClassName("progress__left")[0];
    seconds = seconds.innerHTML.slice(2, 4);
    console.log(seconds + " - seconds ")
    previousTarget[0].click();
    if (seconds >= 3) {
        let updater = setTimeout(function() {
            previousTarget[0].click();
            console.log("updater");
        }, 100);
    }
    updateNameTrack();
}

function setPause() {
    let pauseTarget = document.getElementsByClassName("deco-player-controls__button player-controls__btn_play");
    pauseTarget[0].click();
    console.log("title " + pauseTarget[0].title)
    console.log("getTimeStamp " + this.getTimeStamp())

    sendMsgPause();
}

function setNext() {
    let nextTarget = document.getElementsByClassName("player-controls__btn_next");
    nextTarget[0].click();
    console.log("name track before = " + nameTrack);

    updateNameTrack();
    //getNameTrack();
    console.log("update finsh");
    console.log("name track after = " + nameTrack);
    //sendToPopup();
    //sendMsg();
}

function sendNotifications() {

}

let nameTrack = "isEmpty";
let nameArtists = ""
let trackTitleNext = document.getElementsByClassName("track__title");
let progressLeft = document.getElementsByClassName("progress__left");
let i = 0;

function getPause() {
    i++;
    console.log("getPase()First " + " i= " + i)
    let btnPause = document.getElementsByClassName("player-controls__btn_pause")[0];
    console.log("btnPause " + btnPause + " i= " + i)
    if (btnPause == undefined) {
        chrome.runtime.sendMessage({
            btnPause: "isFalse"
        }, function(response) {
            console.log("getPase() false " + btnPause + " i= " + i)
        });

    }
    if (btnPause != undefined) {
        chrome.runtime.sendMessage({
            btnPause: "isTrue"
        }, function(response) {
            console.log("getPase() true " + btnPause + " i= " + i)

        });
    }

}
let isKey = false;
let isBtn = false;
let likes = false;

function setLike() {
    let like = document.getElementsByClassName("d-like_theme-player")[0];
    //if (like.classList.contains("d-icon_heart-full")) {

    like = like.childNodes[0];
    like.click();
    if (likes == true) {
        sendLike(false);
    } else {
        sendLike(true);

    }


}

function sendLike(isLike) {
    chrome.runtime.sendMessage({ like: isLike });
}

function getLike(isLike) {
    let like = document.getElementsByClassName("d-like_theme-player")[0];
    like = like.childNodes[0];
    if (like.classList.contains("d-icon_heart-full")) {
        isLike = true;
        likes = true;
        sendLike(isLike);
        console.log(isLike + " = islike")
    } else {
        isLike = false;
        likes = false;
        sendLike(isLike);
        console.log(isLike + " = islike")
    }
}

function updateNameTrack() {
    let trackTitle = document.getElementsByClassName("track__title");
    nameTrack = trackTitle[0].innerHTML;
    console.log(nameTrack);
    let trackUpdate = document.getElementsByClassName("track__title");

    function startUpdate() {
        return new Promise(resolve => {
            setTimeout(() => {
                trackUpdate = document.getElementsByClassName("track__title");
                console.log("nameTrack = " + nameTrack + " trackUpdate = " + trackUpdate[0].innerHTML);
                if (trackUpdate[0].innerHTML != nameTrack) {
                    nameTrack = trackUpdate[0].innerHTML;
                    console.log("stop was" + nameTrack);
                    resolve('resolved');
                    //clearInterval(updater);
                } else {
                    asyncCall();
                }

            }, 700);
        });

    }
    async function asyncCall() {
        var result = await startUpdate();
        console.log(result);
        console.log("dsfg");
        if (isBtn == true) {
            sendToPopup();
            isBtn = false;
        }
        if (isKey == true) {
            sendMsg();
            isKey = false;
        }

    }
    asyncCall();
    console.log("out UpdateTrack");

}

function getNextImg() {

}

function getNameTrack() {
    nameArtists = "";
    let trackTitle = document.getElementsByClassName("track__title");
    nameTrack = trackTitle[0].innerHTML;
    console.log(nameTrack);
    let artists = document.getElementsByClassName("d-artists__expanded");
    let textArtist = artists[0].childNodes;
    console.log("lenght = " + textArtist.length)
    for (let i = 0; i <= textArtist.length - 1; i++) {
        console.log(textArtist[i].text);
        if (textArtist[i].text != undefined) {
            nameArtists += textArtist[i].text;
        }
        if (textArtist.length >= 1 && textArtist[i].text != undefined && i != textArtist.length - 1) {
            nameArtists += ", ";

        }

    }
    console.log(nameArtists)

}

let imgTrack;

function getTrackImg() {
    // let getImg = document.getElementsByClassName("entity-cover__image");
    // imgTrack = getImg[0].src;
    // console.log(imgTrack);

    let getImg = document.getElementsByClassName("track_type_player");
    let imgFirst = getImg[0].childNodes;
    console.log("imgFirst lenght = " + imgFirst.length)
    let imgTwo;
    let imgThree;
    imgTwo = imgFirst[0].childNodes;
    console.log("imgTwo lenght = " + imgTwo.length)

    imgThree = imgTwo[0].childNodes;
    console.log("imgThree lenght = " + imgThree.length)

    for (let i = 0; i <= imgThree.length - 1; i++) {
        //console.log(imgThree[i]);
        imgTrack = imgThree[i].src;
    }
}

function sendMsg() {
    getNameTrack();
    //updateNameTrack();
    getPause();
    getTrackImg();
    chrome.runtime.sendMessage({ backgroundMessage: "background", name: nameTrack, artists: nameArtists, imageUrl: imgTrack }, function(response) {});
    chrome.runtime.sendMessage({ popupMessage: "popup", name: nameTrack, artists: nameArtists, imageUrl: imgTrack }, function(response) {
        console.log("sent to pop");
    });
}

function sendMsgPause() {
    getNameTrack();
    getTrackImg();
    chrome.runtime.sendMessage({ backgroundMessage: "background", name: nameTrack, artists: nameArtists, imageUrl: imgTrack }, function(response) {});
}

function sendToPopup() {
    console.log("pop  before = " + nameTrack);
    console.log("pop  after = " + nameTrack);
    //updateNameTrack();
    getNameTrack();
    getTrackImg();
    getPause();
    getLike();
    chrome.runtime.sendMessage({ popupMessage: "popup", name: nameTrack, artists: nameArtists, imageUrl: imgTrack }, function(response) {
        console.log("sent to pop");
    });
}