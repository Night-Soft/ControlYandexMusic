let previous = document.getElementsByClassName("previous");
let pause = document.getElementsByClassName("pause");
let next = document.getElementsByClassName("next");
let title = document.getElementsByClassName("title");
let trackName = document.getElementsByClassName("name-track");
let aritstName = document.getElementsByClassName("name-artists");
let trackImage = document.getElementsByClassName("cover");
let modal = document.getElementsByClassName("modal");
let modalCover = document.getElementsByClassName("modal-cover");
let like = document.getElementsByClassName("like");
let contactMe = document.getElementById("contactMe");
let btnYes = document.getElementById("Yes");
let bntNo = document.getElementById("No");
let btnNew = document.getElementById("New");
let appDetected = document.getElementById("AppDetected");
let appQuestion = document.getElementById("AppQuestion");
let shortCuts = document.getElementById("shortCuts");
let settings = document.getElementById("settings");
let showNotify = document.getElementById("showNotify");
let listSettings = document.getElementById("listSettings");

let container = document.getElementsByClassName("container")[0];
let containerMenu = document.getElementsByClassName("content-menu")[0];
let modalSide = document.getElementsByClassName("modal-side")[0];
let about = document.getElementsByClassName("side")[0];
let supportMenu = document.getElementsByClassName("support-menu")[0];
let closeSide = document.getElementsByClassName("close-side")[0];
let aMenu = document.getElementsByTagName("a")[0];
let payPal = document.getElementsByClassName("paypal-menu")[0];
let donationAlerts = document.getElementsByClassName("donationalerts-menu")[0];
let sideHelp = document.getElementsByClassName("side-help")[0];
let noConnect = document.getElementsByClassName("no-connect")[0];
let loaderContainer = document.getElementsByClassName("loader-container")[0];
let yesNoNew = document.getElementsByClassName("yes-no-new")[0];
let settingsClass = document.getElementsByClassName("settings")[0];

settingsClass.onmouseenter = () => {
    listSettings.classList.remove("scale-from-top-out");
    listSettings.className += " scale-from-top";
    listSettings.style.display = "flex";

}
settingsClass.onmouseleave = () => {
    listSettings.classList.remove("scale-from-top");
    listSettings.className += " scale-from-top-out";
    listSettings.addEventListener("animationend", endAnimationList);

}

function endAnimationList() {
    listSettings.classList.remove("scale-from-top-out");
    listSettings.classList.remove("scale-from-top");
    listSettings.style.display = "none";
    listSettings.removeEventListener("animationend", endAnimationList);
}

let i = 0;
let tabId = 0;
let tabIs = 0;
let isPlay = false;
let isMenuOpen = false;
let isConnected = false;
let newOrReload = true;

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.uploaded == true) {
            chrome.tabs.update(request.activeTab, {
                active: true
            });
        }
        if (request.isConnect == true) {
            isConnected = true;
            noConnect.style.display = "none";
        }
    });


btnYes.onclick = () => {
    if (newOrReload == true) {
        openNewTab();

    } else {
        chrome.tabs.query({
            windowType: "normal"
        }, function(tabs) {
            for (let i = tabs.length - 1; i >= 0; i--) {
                if (tabs[i].url.startsWith("https://music.yandex")) {
                    chrome.tabs.reload(tabs[i].id);
                    setTimeout(function() {
                        firstLoadMessage(tabs[i].id)
                    }, 3000);
                    loaderContainer.style.display = "block";
                    appDetected.innerHTML = chrome.i18n.getMessage("waitWhilePage");
                    appQuestion.style.display = "none";
                    yesNoNew.style.display = "none";
                    break;

                }
            }
        });
    }
}
bntNo.onclick = () => {
    noConnect.classList.add("puff-out-center");
    noConnect.addEventListener("animationend", function() {
        noConnect.style.display = "none";

    });
}
btnNew.onclick = () => {
    openNewTab();
}

let getConnect = () => {
    if (isConnected == false) {
        noConnect.style.display = "flex";
        noConnect.classList.add("puff-in-center");
        newOrReload = false;
    }
}
let currentTab;
let getCurrentTab = () => {
    chrome.tabs.query({
        windowType: "normal",
        active: true
    }, function(tabs) {
        currentTab = tabs[0].id;
    });
}
let goBackTab = () => {
    chrome.tabs.update(currentTab, {
        active: true
    });
}
let openNewTab = () => {
    chrome.tabs.create({
        url: "https://music.yandex.ru/home",
        active: false
    });
    setTimeout(function() {
        sendFirstLoad();
    }, 3000);
    loaderContainer.style.display = "block";
    appDetected.innerHTML = chrome.i18n.getMessage("waitWhilePage");
    appQuestion.style.display = "none";
    yesNoNew.style.display = "none";
}
document.addEventListener('DOMContentLoaded', function() {
    sendEvent("extensionIsLoad");
    getTab().then(function(value) {
        if (value == false) {
            appDetected.innerHTML = chrome.i18n.getMessage("appNoDetected");
            appQuestion.innerHTML = chrome.i18n.getMessage("appNoQuestion");
            noConnect.style.display = "flex";
            btnNew.style.display = "none";
        } else {
            appDetected.innerHTML = chrome.i18n.getMessage("appDetected");
            appQuestion.innerHTML = chrome.i18n.getMessage("appQuestion");
            getConnect();
        }
    });


});
let isPlaying;
chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        switch (request.data) {
            case 'currentTrack':
                let artists = request.api.artists;
                let nameArtists = "";
                for (let i = 0; i < artists.length; i++) {
                    nameArtists += artists[i].title + ", ";
                    if (i + 1 == artists.length) {
                        nameArtists = nameArtists.slice(-nameArtists.length, -2);
                    }
                }
                let nameTrack = request.api.title;
                let iconTrack = request.api.cover;
                let isLike = request.api.liked;
                isPlaying = request.isPlaying;
                setMediaData(nameTrack, nameArtists, iconTrack);
                changeState(isPlaying);
                toggleLike(isLike);
                break;
            case 'togglePause':
                isPlaying = request.isPlaying;
                changeState(isPlaying);
                break;
            case 'toggleLike':
                let is = request.isLiked.liked;
                toggleLike(is);
                break;
            default:
                break;
        }

    });
container.onclick = function() {
    toggleMenu();
}

previous[0].addEventListener('click', function() {
    sendEvent("previous");
    //pushEvent(previous[0].className, "clicked")
});

pause[0].addEventListener('click', function() {
    sendEvent("togglePause");
    //pushEvent(pause[0].className, "clicked")

});

next[0].addEventListener('click', function() {
    sendEvent("next");
    //pushEvent(next[0].className, "clicked")

});
like[0].onclick = function() {
    sendEvent("toggleLike");
    //pushEvent(like[0].className, "clicked")

}

function toggleLike(is) {
    if (is == true) { // noGood
        like[0].style.backgroundImage = "url(img/like.png)";
    } else {
        like[0].style.backgroundImage = "url(img/disliked.png)";

    }
}

trackImage[0].addEventListener('click', function() {
    openCover();
});

modal[0].onclick = function() {
    modal[0].style.display = "none";
}

shortCuts.onclick = () => {
    chrome.tabs.create({
        url: "chrome://extensions/shortcuts"
    });
}
contactMe.onclick = () => {
    window.open("mailto:nightsoftware@outlook.com");
}
aMenu.onclick = () => {
    window.open("mailto:nightsoftware@outlook.com");
}

closeSide.onclick = () => {
    toggleMenu();
}

about.onclick = () => {
    chrome.tabs.create({
        url: "about.html"
    })
    pushEvent(about.className)

}
supportMenu.onclick = () => {}
    // payPal.onclick = () => {
    //     pushEvent("payPal");
    //     window.open("https://www.paypal.com/paypalme2/NightSoftware");

// }
donationAlerts.onclick = () => {
    pushEvent("donationAlerts");
    window.open("https://www.donationalerts.com/r/nightsoftware");
}
sideHelp.onmouseenter = (event) => {
    //payPal.style.display = "block";
    donationAlerts.style.display = "block";
    sideHelp.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });

}
sideHelp.onmouseleave = () => {
    //payPal.style.display = "none";
    donationAlerts.style.display = "none";
}
let addAnimListener = () => {
    if (isMenuOpen == true) {
        containerMenu.addEventListener("animationend", endAnimation);
    }
}
let endAnimation = () => {
    modalSide.style.display = "none"
    isMenuOpen = false;
    containerMenu.removeEventListener("animationend", endAnimation);
    // groove.style.zIndex = "0";
}
let toggleMenu = () => {
    container.classList.toggle("change");
    if (isMenuOpen == false) {
        containerMenu.style.display = "flex";
        modalSide.style.display = "block"
        modalSide.style.opacity = "1";
        containerMenu.className = containerMenu.className.replace(" slide-out", " slide-right");
        isMenuOpen = true;
    } else {
        containerMenu.className = containerMenu.className.replace(" slide-right", " slide-out");
        modalSide.style.opacity = "0";
        addAnimListener();
    }
}

function getTab() {
    return new Promise(function(resolve, reject) {
        chrome.tabs.query({
            windowType: "normal"
        }, function(tabs) {
            for (let i = tabs.length - 1; i >= 0; i--) {
                if (tabs[i].url.startsWith("https://music.yandex")) {
                    tabId = tabs[i].id;
                    tabId = tabs[i].id;
                    tabIs = true;
                    resolve(tabs[i].id);
                } else if (tabIs != true && i == 0) {
                    tabIs = false;
                    resolve(false);
                }
            }
        });
    });
}

function sendEvent(event) {
    let activeTab;
    chrome.tabs.query({
        windowType: "normal"
    }, function(tabs) {
        for (let i = tabs.length - 1; i >= 0; i--) {
            if (tabs[i].url.startsWith("https://music.yandex")) {
                activeTab = tabs[i].id;
                break;
            }
        }
        if (activeTab != undefined) {
            chrome.tabs.sendMessage(activeTab, {
                data: event,
            });
        }

    });
}

let firstLoadMessage = (activeTab) => {
    chrome.runtime.sendMessage({
        loading: true,
        activeTab: activeTab
    });

}

function sendFirstLoad() {
    let activeTab;
    chrome.tabs.query({
        windowType: "normal"
    }, function(tabs) {
        for (let i = tabs.length - 1; i >= 0; i--) {
            if (tabs[i].url.startsWith("https://music.yandex")) {
                activeTab = tabs[i].id;
                break;
            }
        }
        firstLoadMessage(activeTab);
    });
}


let urlCover;

function setMediaData(trackTitle, trackArtists, iconTrack) {
    aritstName[0].innerHTML = trackArtists;
    trackName[0].innerHTML = trackTitle;
    iconTrack = "https://" + iconTrack
    if (iconTrack.endsWith(".svg")) {
        iconTrack = "img/icon.svg"
    } else {
        iconTrack = iconTrack.slice(0, -2);
        iconTrack += "200x200";
        urlCover = iconTrack;
    }
    trackImage[0].style.backgroundImage = "url(" + iconTrack + ")";
}

function changeState(isPlaying) {
    if (isPlaying == false) {
        pause[0].style.backgroundImage = "url(img/play.png)";
        pause[0].style.backgroundPosition = "26px center";
        pause[0].style.backgroundSize = "46px";
    } else {
        pause[0].style.backgroundImage = "";
        pause[0].style.backgroundPosition = "";
        pause[0].style.backgroundSize = "";
    }
}


function openCover() {
    let px = 400;
    var xhttp = new XMLHttpRequest();
    getStatus();

    function getStatus() {
        urlCover = urlCover.slice(0, -7);
        urlCover += px + "x" + px;
        xhttp.onload = function() {
            if (this.readyState == 4 && this.status == 200) {
                modalCover[0].style.backgroundImage = "url(" + urlCover + ")";
                modalCover[0].src = urlCover;
                modalCover[0].onload = () => {
                    modal[0].style.display = "flex";
                }
            } else {
                if (px > 100) {
                    if (px == 100) {
                        px += -50;
                        getStatus();
                    }
                    px += -100;
                    getStatus();
                } else {
                    console.error(this.status);
                }

            }
        };
        xhttp.open("GET", urlCover, true);
        xhttp.send();
    };
}





let pushEvent = (target, event) => {
    _gaq.push(['_trackEvent', target, event]);
}