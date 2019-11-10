let previous = document.getElementsByClassName("previous");
let pause = document.getElementsByClassName("pause");
let next = document.getElementsByClassName("next");
let title = document.getElementsByClassName("title");
let trackName = document.getElementsByClassName("name-track");
let aritstName = document.getElementsByClassName("name-artists");
let trackImg = document.getElementsByClassName("cover");
let modal = document.getElementsByClassName("modal");
let modalCover = document.getElementsByClassName("modal-cover");
let like = document.getElementsByClassName("like");
let container = document.getElementsByClassName("container")[0];
let containerMenu = document.getElementsByClassName("content-menu")[0];
let modalSide = document.getElementsByClassName("modal-side")[0];
let contactMe = document.getElementById("contactMe");
//let home = document.getElementsByClassName("side")[0];
let about = document.getElementsByClassName("side")[0]; //[1]
let shortCuts = document.getElementsByClassName("side")[2]
let supportMenu = document.getElementsByClassName("support-menu")[0];
let closeSide = document.getElementsByClassName("close-side")[0];
let aMenu = document.getElementsByTagName("a")[0];
let payPal = document.getElementsByClassName("paypal-menu")[0];
let donationAlerts = document.getElementsByClassName("donationalerts-menu")[0];
let sideHelp = document.getElementsByClassName("side-help")[0];

// let groove = document.getElementsByClassName("groove-all")[0];
// let grooveCurrent = document.getElementsByClassName("groove-current")[0];
// let handle = document.getElementsByClassName("handle")[0];
// let moveTime = document.getElementsByClassName("move-time")[0];

let statePlay = false;
let isBarOpen = false;
//let isLike = false;
let i = 0;
let addAnimListener = () => {
    if (isBarOpen == true) {
        containerMenu.addEventListener("animationend", endAnimation);
    }
}
let endAnimation = () => {
    modalSide.style.display = "none"
    isBarOpen = false;
    console.log("endAnimation");
    containerMenu.removeEventListener("animationend", endAnimation);


}
let toggleMenu = () => {
    container.classList.toggle("change");
    if (isBarOpen == false) {
        containerMenu.style.display = "flex";
        modalSide.style.display = "block"
        modalSide.style.opacity = "1";
        containerMenu.className = containerMenu.className.replace(" slide-out", " slide-right");
        isBarOpen = true;

    } else {
        containerMenu.className = containerMenu.className.replace(" slide-right", " slide-out");
        modalSide.style.opacity = "0";
        addAnimListener();

    }

}
document.addEventListener('DOMContentLoaded', function() {
    sendEvent("extensionIsLoad");
    sendEvent("getPause");
    //pushEvent("Extension Loaded", "loaded");
    container.onclick = function() {
        toggleMenu();
    }
    previous[0].addEventListener('click', function() {
        sendEvent("previous", true);
        console.log("previous click");
        pushEvent(previous[0].className, "clicked")

    });
    pause[0].addEventListener('click', function() {
        sendEvent("pause");
        changeState();
        console.log("pause click");
        pushEvent(pause[0].className, "clicked")

        //console.log(pause[0].className)



    });
    next[0].addEventListener('click', function() {
        sendEvent("next", true);
        console.log("next click");
        pushEvent(next[0].className, "clicked")

    });
    trackImg[0].addEventListener('click', function() {
        openCover();
    });
    modal[0].onclick = function() {
        modal[0].style.display = "none";

    }
    like[0].onclick = function() {
        sendEvent("like");
        pushEvent(like[0].className, "clicked")

    }
    shortCuts.onclick = () => {
        chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
    }
    contactMe.onclick = () => {
        //document.location.href = "mailto:support@night-software.cf";
        //document.location.href = "mailto:xyz@something.com";
        //window.open("https://github.com/Night-Soft/MyCountDownTimer");
        window.open("mailto:support@night-software.cf");

        console.log("mailto");


    }
    aMenu.onclick = () => {
            window.open("mailto:support@night-software.cf");
        }
        // modalSide.onclick = () => {
        //     toggleMenu();
        // }
    closeSide.onclick = () => {
            toggleMenu();
        }
        // home.onclick = () => {
        //     chrome.tabs.create({ url: "home.html" });
        // }
    about.onclick = () => {
        chrome.tabs.create({
            url: "about.html"
        })
        pushEvent(about.className)

    }
    supportMenu.onclick = () => {
        console.log("supportMenu");

    }
    payPal.onclick = () => {
        pushEvent("payPal");
        window.open("https://www.paypal.com/paypalme2/NightSoftware");

    }
    donationAlerts.onclick = () => {
        pushEvent("donationAlerts");
        window.open("https://www.donationalerts.com/r/nightsoftware");

    }
    sideHelp.onmouseenter = (event) => {
        console.log("side-help");
        payPal.style.display = "block";
        donationAlerts.style.display = "block";
        //home.style.display = "none";

    }
    sideHelp.onmouseleave = () => {
            console.log("side-help");
            payPal.style.display = "none";
            donationAlerts.style.display = "none";
            //home.style.display = "block";
        }
        // groove.onclick = function(event) {
        //     var x = event.clientX;
        //     x += -25;
        //     grooveCurrent.style.width = x + "px";
        //     handle.style.left = "calc(" + x + "px - " + "10px)";
        //     //var y = event.clientY;
        //     console.log("X coords: " + x);
        //     moveTime.style.display = "flex";

    //     groove.onmousedown = function(event) {

    //         groove.onmousemove = function(event) {
    //             var x = event.clientX;
    //             x += -25;
    //             grooveCurrent.style.width = x + "px";
    //             handle.style.left = "calc(" + x + "px - " + "10px)";
    //             console.log("X coords: " + x);
    //             moveTime.style.display = "flex";
    //         }
    //         groove.onmouseup = function() {
    //             groove.onmousemove = null;
    //             document.onmousemove = null;
    //             moveTime.style.display = "none";


    //         }

    //     }
    // }



    // groove.onclick = function(event) {

    // }


});
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.popupMessage == "popup") {
            console.log(request.popupMessage)
            setMediaData(request.name, request.artists, request.imageUrl);
        }
        if (request.btnPause == "isTrue") {
            statePlay = true;
            changeState();
            console.log(request.btnPause)
        }
        if (request.btnPause == "isFalse") {
            statePlay = false;
            changeState();
            console.log(request.btnPause)
        }
        if (request.like == true) {
            setLike(request.like);
            console.log(request.like + " - like")

        }
        if (request.like == false) {
            setLike(request.like);
            console.log(request.like + " - like")

        }


    });



function sendEvent(event, isBtn) {
    let activeTab;
    chrome.tabs.query({
        //url: "https://music.yandex.ua/*",
        windowType: "normal"
    }, function(tabs) {
        for (let i = tabs.length - 1; i >= 0; i--) {
            console.log("tabs length = " + tabs.length);
            if (tabs[i].url.startsWith("https://music.yandex")) {
                console.log(tabs[i].url);
                console.log("current tab = " + i);
                activeTab = tabs[i].id;
                break;
            }
        }
        //chrome.tabs.executeScript(null, { code: "externalAPI.togglePause();" });
        chrome.tabs.sendMessage(activeTab, {
            data: event,
            btn: isBtn
        }, function(response) {
            console.log('success ' + event);

        });
    });
}
let urlCover;
let pushEvent = (target, event) => {
    _gaq.push(['_trackEvent', target, event]);

}

function setMediaData(trackTitle, trackArtists, iconTrack) {
    console.log(trackName[0].innerHTML)
    aritstName[0].innerHTML = trackArtists;
    trackName[0].innerHTML = trackTitle;
    if (iconTrack.endsWith(".svg")) {
        iconTrack = "img/icon.svg"
    } else {
        iconTrack = iconTrack.slice(0, -5);
        iconTrack += "200x200";
        console.log(iconTrack)
        urlCover = iconTrack;
    }

    trackImg[0].style.backgroundImage = "url(" + iconTrack + ")";
}


function changeState() {
    if (statePlay == false) {
        pause[0].style.backgroundImage = "url(img/play.png)";
        pause[0].style.backgroundPosition = "26px center";
        pause[0].style.backgroundSize = "46px";
        statePlay = true;
    } else {
        pause[0].style.backgroundImage = "";
        pause[0].style.backgroundPosition = "";
        pause[0].style.backgroundSize = "";
        statePlay = false;

    }
}

function setLike(isLike) {
    if (isLike == true) { // noGood
        like[0].style.backgroundImage = "url(img/like.svg)";
    } else {
        like[0].style.backgroundImage = "url(img/unLike.svg)";

    }

}

function openCover() {
    //check an URL is valid or broken
    let px = 400;
    let statusText = 0;
    console.log("urlCover" + urlCover)
    console.log(urlCover)
    urlCover = urlCover.slice(0, -7);
    console.log(urlCover)
    for (let i = 3; i >= 0; i--) {
        urlCover += px + "x" + px;
        getStatus();
        console.log("i = " + i);
        console.log("statusText = " + statusText)
        console.log("px = " + px)

        if (statusText == 200) {
            break;
        } else {
            if (px == 100) {
                px += -50;
                console.log("px = " + px)
                break;
            }
            px += -100;
        }

    }
    modalCover[0].style.backgroundImage = "url(" + urlCover + ")";
    modalCover[0].src = urlCover;

    let msTimer = setInterval(updater, 1);
    let ms = 0;
    let seconds = 0;

    function updater() {
        ms++;
        if (ms == 999) {
            seconds++;
        }
        modalCover[0].onload = () => {
            clearInterval(msTimer);
            console.log("seconds = " + seconds + " ms = " + ms);
            modal[0].style.display = "flex";
        }
    }


    function getStatus() {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                console.log("status = " + this.status)
                statusText = this.status;
                console.log("statusText = " + statusText)

                //console.log("status text = " + statusText)
            } else {
                console.log("status = " + this.status)
                statusText = this.status;
                console.log("statusText = " + statusText)


            }
        };
        xhttp.open("post", urlCover, false);
        xhttp.send();
    }

}

// function getYandexTab(tabActive) {
//     chrome.tabs.query({ url: "https://music.yandex.ua/*", currentWindow: true }, function(tabs) {
//         for (let i = tabs.length - 1; i >= 0; i--) {
//             console.log(tabs[i].url);
//         }
//         console.log(tabs.length);

//     });

// }

// background-position: 18px center;
// background-size: 46px;