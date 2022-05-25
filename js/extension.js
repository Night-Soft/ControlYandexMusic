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
let yesNews = document.getElementById("YesNews");
let whatNew = document.getElementById("whatNew");

let container = document.getElementsByClassName("container")[0];
let containerMenu = document.getElementsByClassName("content-menu")[0];
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
let hamburgerMenuList = document.getElementsByClassName("hamburger-menu-list")[0];
let modalNews = document.querySelector(".modal-news");

let contentListMenu = document.getElementsByClassName("content-list-menu")[0];
let modalListMenu = document.getElementsByClassName("modal-list-menu")[0];

let isMenuListOpen = false;
let isMenuOpen = false;
let newOrReload = true;
let urlCover;

let Extension = {
    onload: function() {
        sendEvent("extensionIsLoad", true);
        getYandexMusicTab().then(function(value) {
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
        transition[3].style.transition = "0.7s"
        transition[4].style.transition = "0.7s"
        transition[5].style.transition = "0.7s"
    },
};

chrome.runtime.onMessage.addListener( // background, content script
    function(request, sender, sendResponse) {
        if (request.onload == true) {
            getYandexMusicTab().then((id) => {
                chrome.tabs.update(id, {
                    active: true
                });
            });
        }
        if (request.options) {
            setOptions(request.options);
            if (request.options.isShowWhatNew) {
                checkNew();
            }
        }
    });

chrome.runtime.onMessageExternal.addListener( // injected script
    function(request, sender, sendResponse) {
        switch (request.data) {
            case 'currentTrack': // get from the key
                setMediaData(request.api.title, getArtists(request.api, 5), request.api.cover);
                changeState(request.isPlaying);
                toggleLike(request.api.liked);
                getDuration(request.api.duration);
                getProgress(request.progress.position);
                getIsPlay(request.isPlaying);
                setTrackProgress();
                trackUpdater();
                break;
            case 'togglePause':
                changeState(request.isPlaying);
                trackUpdater(getDuration(), getProgress(), getIsPlay(request.isPlaying));
                break;
            case 'toggleLike':
                toggleLike(request.isLiked.liked);
                updateTracksListLike(request.isLiked.liked);
                break;
            default:
                break;
        }

        if (request.trackInfo) {
            updateTracksList(request.trackInfo);
        }
        if (request.hasOwnProperty('controls')) {
            updateRepeat(request.controls.repeat);
            updateShuffle(request.controls.shuffle);
        }
        if (request.hasOwnProperty('volume')) {
            updateVolume(request.volume);
        }
        if (request.hasOwnProperty('repeat')) {
            updateRepeat(request.repeat);
        }
        if (request.hasOwnProperty('shuffle')) {
            updateShuffle(request.shuffle);
        }
        if (request.hasOwnProperty('progress')) {
            if (Object.keys(request).length == 1) {
                getProgress(request.progress.position);
                if (request.progress.position == 0) {
                    setTimeout(() => {
                        trackUpdater();
                    }, 500);
                } else {
                    trackUpdater();
                }
            }
        }
        return true;
    });

settingsClass.onmouseenter = () => {
    listSettings.removeEventListener("animationend", endAnimationList);
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

let noConnceted = () => {
    bntNo.style.display = "none";
    btnYes.innerHTML = chrome.i18n.getMessage("reload");
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
    loaderContainer.style.display = "block";
    appDetected.innerHTML = chrome.i18n.getMessage("waitWhilePage");
    appQuestion.style.display = "none";
    yesNoNew.style.display = "none";
}

container.onclick = function() {
    toggleMenu();
}

let toggleListMenu = () => {
    hamburgerMenuList.classList.toggle("change-list");
    let removeOpacity = () => {
        modalListMenu.classList.remove("opacity");
        modalListMenu.removeEventListener("animationend", removeOpacity);
        scrollToSelected();
    }
    let removeOpacityReverse = () => { // run after 0.7s
        modalListMenu.classList.remove("opacity-reverse");
        modalListMenu.style.display = "none"
        modalListMenu.removeEventListener("animationend", removeOpacityReverse);
    }
    let endListAnimation = (ev) => {
        modalListMenu.style.display = "none"
        isMenuListOpen = false;
        contentListMenu.removeEventListener("animationend", endListAnimation);
    }
    if (isMenuListOpen == false) { // open menu
        modalListMenu.addEventListener("animationend", removeOpacity);
        modalListMenu.classList.add("opacity");
        contentListMenu.classList.add("slide-left");
        modalListMenu.style.display = "block";
        isMenuListOpen = true;
    } else {
        modalListMenu.classList.add("opacity-reverse");
        modalListMenu.addEventListener("animationend", removeOpacityReverse);
        contentListMenu.classList.remove("slide-left");
        contentListMenu.classList.add("slide-left-out");
        contentListMenu.addEventListener("animationend", endListAnimation);

    }
}
modalListMenu.onclick = (e) => {
    if (e.target !== modalListMenu) { return; }
    toggleListMenu();
}
hamburgerMenuList.onclick = () => {
    toggleListMenu();
}

previous[0].addEventListener('click', function() {
    sendEvent("previous");
    stopUpdater();
    pushEvent(previous[0].className, "clicked")
});

pause[0].addEventListener('click', function() {
    sendEvent("togglePause");
    pushEvent(pause[0].className, "clicked")

});

next[0].addEventListener('click', function() {
    sendEvent("next");
    stopUpdater();
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
        modal[0].classList.remove("modal-background");
        modalCover[0].removeEventListener("animationend", removeClass);
    }
    modalCover[0].addEventListener("animationend", removeClass);
    modal[0].classList.add("modal-background");
    openCover(trackImage[0], urlCover);
    pushEvent("Cover open", "clicked")


});

modal[0].onclick = function() {
    function removeClass() {
        modal[0].classList.remove("modal-background-reverse");
        modal[0].removeEventListener("animationend", removeClass);
        modal[0].style.display = "none";
    }
    modal[0].addEventListener("animationend", removeClass);
    modal[0].classList.add("modal-background-reverse");
    let options = {
        duration: 500,
        direction: 'reverse',
    }
    if (CurrentAnimation.isFromList) {
        let offset = (el) => {
            let rect = el.getBoundingClientRect(),
                scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
                scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            return {
                top: rect.top + scrollTop,
                left: rect.left + scrollLeft
            }
        }
        let itemOffset = offset(State.coverItem);
        let left = -(window.innerWidth / 2 - State.coverItem.offsetWidth / 2 - itemOffset.left);
        let top = -(window.innerHeight / 2 - State.coverItem.offsetHeight / 2 - itemOffset.top);
        CurrentAnimation.keyframe.transform = ['translate(' + parseInt(left) + 'px, ' +
            parseInt(top) + 'px)', 'translate(0px, 0px)'
        ];
    }

    modalCover[0].animate(CurrentAnimation.keyframe, options);
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

whatNew.onclick = () => {
    WhatNew.openNews();
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
donationAlerts.onmouseenter = () => {
    sideHelp.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
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
}
let toggleMenu = () => {
    container.classList.toggle("change");
    let modalSide = document.getElementsByClassName("modal-side")[0];
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

function getYandexMusicTab() {
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

function sendEvent(event, isResponse = false) {
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
                if (isResponse) {
                    if (event == "extensionIsLoad" && response == undefined) {
                        noConnceted();
                        console.log("No connection");
                    }
                }
            });
        }

    });
}

let setRightFontSize = (fontSize = 1.4) => {
    let heightArtist = aritstName[0].offsetHeight;
    let heightTrack = trackName[0].offsetHeight;

    if (heightArtist + heightTrack > 150) {
        fontSize = fontSize - 0.05;
        fontSize = fontSize.toFixed(2);
        aritstName[0].style.fontSize = fontSize + "rem";
        trackName[0].style.fontSize = fontSize + "rem";
        setRightFontSize(fontSize);
    }
}

function setMediaData(trackTitle, trackArtists, iconTrack) {
    aritstName[0].innerHTML = trackArtists;
    trackName[0].innerHTML = trackTitle;
    aritstName[0].style.fontSize = "";
    trackName[0].style.fontSize = "";
    setRightFontSize();
    urlCover = getUrl(iconTrack, 200);
    trackImage[0].style.backgroundImage = "url(" + urlCover + ")";
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
let getUrl = (url, size = 50) => {
    if (url == undefined) {
        url = "img/icon.png"
        return url;
    } else {
        let endSlice = url.lastIndexOf("/") - url.length + 1;
        if (!url.startsWith("https://")) {
            url = "https://" + url
        }
        url = url.slice(0, endSlice); // -
        url += size + "x" + size;
        return url;
    }
}

function testImage(url, size = 400, callback) {
    try {
        modalCover[0].src = getUrl(url, size);
        modalCover[0].onerror = function() {
            if (size > 100) {
                if (size == 100) {
                    size += -50;
                    testImage(getUrl(url, size), size)
                }
                size += -100;
                testImage(getUrl(url, size), size);
            }
        };
        modalCover[0].onload = () => {
            modal[0].style.display = "flex";
            callback.animate(callback.parameter); // call animation

        }

    } catch (error) {
        console.log(error);
    }
}
let animateMainImage = (item) => {
    let width = item.offsetWidth;
    let height = item.offsetHeight;
    let left = -(window.innerWidth / 2 - width / 2 - item.offsetLeft);
    let top = -(window.innerHeight / 2 - height / 2 - item.offsetTop);

    let keyframe = {
        width: [width + 'px', 80 + '%'],
        height: [height + 'px', 96 + '%'],
        transform: ['translate(' + left + 'px, ' + top + 'px)', 'translate(0px, 0px)'],
        borderRadius: ['15px', '20px'],
        easing: ['cubic-bezier(.85, .2, 1, 1)']
    }
    let options = {
        duration: 500,
        fill: 'both'
    }

    CurrentAnimation.keyframe = keyframe;
    CurrentAnimation.options = options;
    CurrentAnimation.isFromList = false;
    modalCover[0].animate(keyframe, options);
}

function openCover(item, url, animate = animateMainImage) {
    testImage(url, 400, { animate: animate, parameter: item });
}

let pushEvent = (target, event) => {
    _gaq.push(['_trackEvent', target, event]);
}