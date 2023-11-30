let title = document.getElementsByClassName("title");
let aritstName = document.getElementsByClassName("name-artists");
let contactMe = document.getElementById("contactMe");
let shortCuts = document.getElementById("shortCuts");
let showNotify = document.getElementById("showNotify");
let listSettings = document.getElementById("listSettings");
let yesNews = document.getElementById("YesNews");
let whatNew = document.getElementById("whatNew");
let sett = document.getElementById("settings");
let modalNews = document.querySelector(".modal-news");

let container = document.getElementsByClassName("container")[0];
let containerMenu = document.getElementsByClassName("content-menu")[0];
let about = document.getElementsByClassName("side")[3];
let supportMenu = document.getElementsByClassName("support-menu")[0];
let closeSide = document.getElementsByClassName("close-side")[0];
let aMenu = document.getElementsByTagName("a")[0];
let payPal = document.getElementsByClassName("paypal-menu")[0];
let donationAlerts = document.getElementsByClassName("donationalerts-menu")[0];
let donateContainer = document.getElementsByClassName("donate-container")[0];
let sideHelp = document.getElementsByClassName("side-help")[0];
let settings = document.getElementsByClassName("settings")[0];
let popupBtn = document.getElementsByClassName("popup-btn")[0];
let listsSortcutKeys = document.getElementsByClassName("list-shortcut-keys")[0];
let selectedShortcutKey = document.getElementsByClassName("select-shortcut-key")[0];

let isMenuListOpen = false;
let isMenuOpen = false;

// list settings

container.onclick = () => {
    toggleMenu();
}

about.onclick = () => {
    chrome.tabs.create({
        url: "about.html"
    })
}

popupBtn.onclick = createPopup;

let isSettingsOpen = false;
let setKeyDescription = (clear = false, shortcutKey, result) => {
    selectedShortcutKey.style.background = "";
    if (clear) {
        let checkBoxReassignT = document.getElementById("checkBoxReassign");
        checkBoxReassignT.innerHTML = chrome.i18n.getMessage("noShortcutSelected");
        selectedShortcutKey.innerHTML = chrome.i18n.getMessage("selectedShortcutKey");
        for (let j = 0; j < listsSortcutKeys.children.length; j++) {
            listsSortcutKeys.childNodes[j].style.background = "";
        }
        return;
    } else {
        if (shortcutKey != undefined) {
            selectedShortcutKey.innerHTML = shortcutKey.innerHTML;
            if (result != undefined) {
                if (result.shortcut != undefined && result.shortcut != '') {
                    selectedShortcutKey.innerHTML = chrome.i18n.getMessage("openPopup") + result.shortcut + "'";
                } else if (result.name != undefined) {
                    selectedShortcutKey.style.background = "#DB0000"
                    selectedShortcutKey.innerHTML = "'" + result.description + "' " + chrome.i18n.getMessage("isNoKeyAction");
                }
            }
        }
        try {
            if (result == undefined) {
                let checkBoxReassignT = document.getElementById("checkBoxReassign");
                checkBoxReassignT.innerHTML = chrome.i18n.getMessage("noShortcutSelected");
                return;
            }
            let checkBoxReassignT = document.getElementById("checkBoxReassign");
            let checkBoxReassignText = chrome.i18n.getMessage("checkBoxReassignFirstHalf") + result.description + chrome.i18n.getMessage("checkBoxReassignSecondHalf");
            checkBoxReassignT.innerHTML = checkBoxReassignText;
            if (result.shortcut != undefined && result.shortcut != '') {
                selectedShortcutKey.innerHTML = chrome.i18n.getMessage("openPopup") + result.shortcut + "'";
            } else if (result.name != undefined) {
                selectedShortcutKey.style.background = "#DB0000"
                selectedShortcutKey.innerHTML = "'" + result.description + "' " + chrome.i18n.getMessage("isNoKeyAction");
            }
        } catch (error) { }
    }
}
settings.onclick = (event) => {
    if (event.target == settings || event.target == sett || event.target == listSettings) {
        if (isSettingsOpen) {
            listSettings.classList.remove("scale-from-top");
            listSettings.className += " scale-from-top-out";
            listSettings.addEventListener("animationend", endAnimationList);
            isSettingsOpen = false;
        } else {
            settings.style.background = "var(--mainRed)";
            settings.style.padding = "15px";
            settings.style.color = "white";
            settings.style.borderRadius = "5px";
            listSettings.removeEventListener("animationend", endAnimationList);
            listSettings.classList.remove("scale-from-top-out");
            listSettings.className += " scale-from-top";
            listSettings.style.display = "flex";
            isSettingsOpen = true;
            listsSortcutKeys.innerHTML = "";

            chrome.commands.getAll().then((result) => {
                for (let i = 0; i < result.length; i++) {
                    let shortcutKey = document.createElement("DIV");
                    shortcutKey.classList.add("shortcut-key");
                    shortcutKey.innerHTML = result[i].description + " " + result[i].shortcut;
                    try {
                        if (Options.reassign.shortCut.index == i) {
                            // set shortcut if previously not set
                            Options.reassign.shortCut.shortcut = result[i].shortcut;
                            setKeyDescription(false, shortcutKey, result[i]);
                        }
                    } catch (error) { }
                    shortcutKey.onclick = (ev) => {
                        if (Options.selectedShortcutKey != undefined) {
                            if (result[i].name == Options.selectedShortcutKey.name) {
                                listsSortcutKeys.childNodes[i].style.background = "";
                                Options.selectedShortcutKey = undefined;
                                setKeyDescription(true);
                                if (checkBoxReassign.checked) {
                                    checkBoxReassign.checked = false;
                                    sendEventBackground({
                                        writeOptions: true,
                                        options: {
                                            reassign: {
                                                isReassign: checkBoxReassign.checked,
                                                shortCut: Options.selectedShortcutKey
                                            },
                                        }
                                    });
                                    setOptions({
                                        reassign: {
                                            isReassign: checkBoxReassign.checked,
                                            shortCut: Options.selectedShortcutKey
                                        }
                                    });
                                }
                                return;
                            }
                        }
                        Options.selectedShortcutKey = result[i];
                        Options.selectedShortcutKey.index = i;
                        if (result[i].shortcut == '') {
                            showNotification(chrome.i18n.getMessage("noShortcutKeyAction"));
                        }
                        shortcutKey.style.background = "#FF2222";
                        for (let j = 0; j < listsSortcutKeys.children.length; j++) {
                            if (j != i) {
                                listsSortcutKeys.childNodes[j].style.background = "";
                            }
                        }
                        setKeyDescription(false, shortcutKey, result[i]);
                        if (checkBoxReassign.checked) {
                            sendEventBackground({
                                writeOptions: true,
                                options: {
                                    reassign: {
                                        isReassign: checkBoxReassign.checked,
                                        shortCut: Options.selectedShortcutKey
                                    },
                                }
                            });
                            setOptions({
                                reassign: {
                                    isReassign: checkBoxReassign.checked,
                                    shortCut: Options.selectedShortcutKey
                                }
                            });
                        }
                    }
                    listsSortcutKeys.appendChild(shortcutKey);
                    if (Options.reassign.isReassign) {
                        if (Options.reassign.shortCut.index == i) {
                            shortcutKey.style.background = "#FF2222";
                        }
                    }
                }
            });
        }
    }
}

let timeToClose;
settings.onmouseleave = () => {
    if (isSettingsOpen) return;
    settings.style.background = "";
    settings.style.padding = "";
    settings.style.color = "";
    settings.style.borderRadius = "";
}
settings.onmouseenter = () => {
    if (timeToClose != undefined) {
        clearTimeout(timeToClose);
    }
}

let endAnimationList = () => {
    listSettings.classList.remove("scale-from-top-out");
    listSettings.classList.remove("scale-from-top");
    listSettings.style.display = "none";
    listSettings.removeEventListener("animationend", endAnimationList);
}

contactMe.onclick = () => {
    window.open("mailto:nightsoftware@outlook.com");
}

whatNew.onclick = () => {
    WhatNew.openNews();
}

shortCuts.onclick = () => {
    chrome.tabs.create({
        url: "chrome://extensions/shortcuts"
    });
}

supportMenu.onclick = () => { }
payPal.onclick = () => {
    window.open("https://www.paypal.com/paypalme2/NightSoftware");

}

donationAlerts.onclick = () => {
    window.open("https://www.donationalerts.com/r/nightapp");
}

donationAlerts.onmouseenter = () => {
    sideHelp.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
}

sideHelp.onmouseenter = (event) => {
    donateContainer.style.display = "flex";
    sideHelp.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
}

sideHelp.onmouseleave = () => {
    donateContainer.style.display = "none";
}

aMenu.onclick = () => {
    window.open("mailto:nightsoftware@outlook.com");
}

closeSide.onclick = () => {
    toggleMenu();
}

modalListMenu.onclick = (e) => {
    if (e.target !== modalListMenu) {
        return;
    }
    toggleListMenu();
}

hamburgerMenuList.onclick = () => {
    toggleListMenu();
}

let toggleListMenu = () => {
    hamburgerMenuList.classList.toggle("change-list");
    let removeOpacity = () => {
        modalListMenu.classList.remove("opacity");
        modalListMenu.removeEventListener("animationend", removeOpacity);
        isMenuListOpen = true;
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
    } else {
        modalListMenu.classList.add("opacity-reverse");
        modalListMenu.addEventListener("animationend", removeOpacityReverse);
        contentListMenu.classList.remove("slide-left");
        contentListMenu.classList.add("slide-left-out");
        contentListMenu.addEventListener("animationend", endListAnimation);

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
        isMenuOpen = true;
    }
    let removeOpacityReverse = () => { // run aferr 0.7s
        modalSide.classList.remove("opacity-reverse");
        modalSide.style.display = "none"
        modalSide.removeEventListener("animationend", removeOpacityReverse);
    }
    if (isMenuOpen == false) {
        modalSide.addEventListener("animationend", removeOpacity);
        modalSide.classList.add("opacity");
        containerMenu.style.display = "flex";
        modalSide.style.display = "block"
        containerMenu.className = containerMenu.className.replace(" slide-out", " slide-right");
    } else {
        modalSide.classList.add("opacity-reverse");
        modalSide.addEventListener("animationend", removeOpacityReverse);
        containerMenu.className = containerMenu.className.replace(" slide-right", " slide-out");
        addAnimListener();
    }
}

let addAnimListener = () => {
    if (isMenuOpen == true) {
        containerMenu.addEventListener("animationend", endAnimation);
    }
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

FileReady.on('Extension');