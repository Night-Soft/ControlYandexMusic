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
let transition = document.getElementsByClassName("transition");

let isMenuOpen = false;
let newOrReload = true;

let Extension = {
    onload: function() {
        openingExtension("extensionIsLoad");
        getTab().then(function(value) {
            if (value == false) {
                appDetected.innerHTML = chrome.i18n.getMessage("appNoDetected");
                appQuestion.innerHTML = chrome.i18n.getMessage("appNoQuestion");
                btnNew.style.display = "none";
                noConnect.style.display = "flex";
            } else {
                appDetected.innerHTML = chrome.i18n.getMessage("appDetected");
                appQuestion.innerHTML = chrome.i18n.getMessage("appQuestion");
            }
        });
    },
    addTransition: () => {
        transition[0].style.transition = "0.7s"
        transition[1].style.transition = "0.7s"
        transition[2].style.transition = "0.7s"
    }

};

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.uploaded == true) {
            chrome.tabs.update(request.activeTab, {
                active: true
            });
        }
    });

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
                setMediaData(request.api.title, nameArtists, request.api.cover);
                changeState(request.isPlaying);
                toggleLike(request.api.liked);
                getDuration(request.api.duration);
                getProgress(request.progress.position);
                getIsPlay(request.isPlaying);
                setTrackProgress();
                trackUpdater()
                break;
            case 'togglePause':
                changeState(request.isPlaying);
                trackUpdater(getDuration(), getProgress(), getIsPlay(request.isPlaying));
                break;
            case 'toggleLike':
                toggleLike(request.isLiked.liked);
                break;
            default:
                break;
        }

    });

function openingExtension(event) {
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
            }, function(response) {
                try {
                    response.isConnect;
                } catch (error) {
                    console.log(error);
                    getConnect()
                }

            });
        }

    });
}
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
    noConnect.style.display = "flex";
    noConnect.classList.add("puff-in-center");
    newOrReload = false;
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

container.onclick = function() {
    toggleMenu();
}

previous[0].addEventListener('click', function() {
    sendEvent("previous");
    pushEvent(previous[0].className, "clicked")
});

pause[0].addEventListener('click', function() {
    sendEvent("togglePause");
    pushEvent(pause[0].className, "clicked")

});

next[0].addEventListener('click', function() {
    sendEvent("next");
    pushEvent(next[0].className, "clicked")

});
like[0].onclick = function() {
    sendEvent("toggleLike");
    pushEvent(like[0].className, "clicked")

}

function toggleLike(is) {
    if (is == true) { // noGood
        like[0].style.backgroundImage = "url(img/like.png)";
    } else {
        like[0].style.backgroundImage = "url(img/disliked.png)";

    }
}

trackImage[0].addEventListener('click', function() {
    function removeClass() {
        modalCover[0].classList.remove("scale-shift-in-center");
        modal[0].classList.remove("modal-background");
        modalCover[0].removeEventListener("animationend", removeClass);
    }
    modalCover[0].addEventListener("animationend", removeClass);
    modalCover[0].classList.add("scale-shift-in-center");
    modal[0].classList.add("modal-background");
    openCover();
    pushEvent("Cover open", "clicked")


});

modal[0].onclick = function() {
    function removeClass() {
        modalCover[0].classList.remove("scale-shift-in-center-reverse");
        modal[0].classList.remove("modal-background-reverse");
        modal[0].style.display = "none";
        modal[0].removeEventListener("animationend", removeClass);
    }
    modal[0].addEventListener("animationend", removeClass);
    modalCover[0].classList.add("scale-shift-in-center-reverse");
    modal[0].classList.add("modal-background-reverse");
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
    donationAlerts.style.display = "flex";
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
let endAnimation = (ev) => {
    ev.stopPropagation();
    isMenuOpen = false;
    containerMenu.removeEventListener("animationend", endAnimation);
    // groove.style.zIndex = "0";
}
let toggleMenu = () => {
    container.classList.toggle("change");
    let removeOpacity = () => {
        modalSide.classList.remove("opacity");
        modalSide.removeEventListener("animationend", removeOpacity);
    }
    let removeOpacityReverse = () => { // run aferr 0.7s
        modalSide.classList.remove("opacity-reverse");
        modalSide.style.display = "none"
        modalSide.removeEventListener("animationend", removeOpacityReverse);
    }
    if (isMenuOpen == false) { // Menu is open! Why is exactly so that? I don't know, it just happened!
        modalSide.addEventListener("animationend", removeOpacity);
        modalSide.classList.add("opacity");
        containerMenu.style.display = "flex";
        modalSide.style.display = "block"
        containerMenu.className = containerMenu.className.replace(" slide-out", " slide-right");
        isMenuOpen = true;
    } else {
        modalSide.classList.add("opacity-reverse");
        modalSide.addEventListener("animationend", removeOpacityReverse);
        containerMenu.className = containerMenu.className.replace(" slide-right", " slide-out");
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
                    resolve(tabs[i].id);
                    break;
                } else if (i == 0) {
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

    if (iconTrack == undefined) {
        iconTrack = "img/icon.png"
    } else {
        iconTrack = "https://" + iconTrack
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
    urlCover = urlCover.slice(0, -7);
    urlCover += px + "x" + px;

    function testImage() {
        try {
            urlCover = urlCover.slice(0, -7);
            urlCover += px + "x" + px;
            modalCover[0].style.backgroundImage = "url(" + urlCover + ")";
            modalCover[0].onerror = function() {
                if (px > 100) {
                    if (px == 100) {
                        px += -50;
                        testImage()
                    }
                    px += -100;
                    testImage();
                }
            };
            modalCover[0].onload = () => {
                modal[0].style.display = "flex";
            }
            modalCover[0].src = urlCover;

        } catch (error) {
            console.log(error);
        }
    }
    testImage();
}

let pushEvent = (target, event) => {
    _gaq.push(['_trackEvent', target, event]);
}