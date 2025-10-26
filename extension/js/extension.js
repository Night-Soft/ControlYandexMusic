let title = document.getElementsByClassName("title");
let shortCuts = document.getElementById("shortCuts");
let showNotify = document.getElementById("showNotify");
let listSettings = document.getElementById("listSettings");
let yesNews = document.getElementById("YesNews");
let whatNew = document.getElementById("whatNew");
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
let gitBtn = document.querySelector(".github-btn .btn ");

gitBtn.onclick = () => {
    chrome.tabs.create({
        url: "https://github.com/Night-Soft/ControlYandexMusic"
    });
}

// list settings

container.onclick = () => {
    toggleMenu();
}

about.onclick = () => {
    chrome.tabs.create({
        url: "about.html"
    })
}
yesNews.onclick = () => {
    modalNews.animate({ opacity: [1, 0] }, { duration: 400 }).onfinish = () => {
        modalNews.style.display = "";
    };
    if(Options.isNewFeaturesShown === false) return;
    Options.isNewFeaturesShown = false;
    writeOptions({ isNewFeaturesShown: false });
}

popupBtn.onclick = createPopup;

let isSettingsOpen = false;
let setKeyDescription = (clear = false, shortcutKey, result) => {
    selectedShortcutKey.style.background = "";
    if (clear) {
        let checkBoxReassignT = document.getElementById("checkBoxReassign");
        checkBoxReassignT.innerText = translate("noShortcutSelected");
        selectedShortcutKey.innerText = translate("selectedShortcutKey");
        for (let j = 0; j < listsSortcutKeys.children.length; j++) {
            listsSortcutKeys.childNodes[j].style.background = "";
        }
        return;
    } else {
        if (shortcutKey != undefined) {
            selectedShortcutKey.innerText = shortcutKey.innerText;
            if (result != undefined) {
                if (result.shortcut != undefined && result.shortcut != '') {
                    selectedShortcutKey.innerHTML = translate("openPopup") + result.shortcut + "'";
                } else if (result.name != undefined) {
                    selectedShortcutKey.style.background = "#DB0000"
                    selectedShortcutKey.innerText = "'" + result.description + "' " + translate("isNoKeyAction");
                }
            }
        }
        try {
            if (result == undefined) {
                let checkBoxReassignT = document.getElementById("checkBoxReassign");
                checkBoxReassignT.innerText = translate("noShortcutSelected");
                return;
            }
            let checkBoxReassignT = document.getElementById("checkBoxReassign");
            let checkBoxReassignText = translate("checkBoxReassignFirstHalf") + result.description + translate("checkBoxReassignSecondHalf");
            checkBoxReassignT.innerText = checkBoxReassignText;
            if (result.shortcut != undefined && result.shortcut != '') {
                selectedShortcutKey.innerHTML = translate("openPopup") + result.shortcut + "'";
            } else if (result.name != undefined) {
                selectedShortcutKey.style.background = "#DB0000"
                selectedShortcutKey.innerText = "'" + result.description + "' " + translate("isNoKeyAction");
            }
        } catch (error) { }
    }
}

let writeReassignOptions = () => {
    writeOptions({
        reassign: {
            isReassign: checkBoxReassign.checked,
            shortCut: Options.selectedShortcutKey
        },
    });
}

settings.addEventListener("click", (event) => {
    const span = document.getElementById("settings");
    if (event.target != settings && event.target !== span) return;
    const listSettingsToggleAnim = new ToggleAnimation(listSettings, {
        open: "scale-from-top",
        close: "scale-from-top-out",
        display: {
            open: "flex",
            close: "none"
        }
    });

    toggleSetCurrentSizeBtn();
    if (isSettingsOpen) {
        listSettingsToggleAnim.close();
        isSettingsOpen = false;
    } else {
        settings.style.background = "var(--topColor)";
        settings.style.padding = "15px";
        settings.style.borderRadius = "5px";
        listSettingsToggleAnim.open();

        isSettingsOpen = true;
        listsSortcutKeys.innerText = "";

        let notification;
        chrome.commands.getAll().then((result) => { 
            for (let i = 1; i < result.length; i++) {
                const onclick = function () {
                    if (Options.selectedShortcutKey != undefined) {
                        if (result[i].name == Options.selectedShortcutKey.name) {
                            listsSortcutKeys.childNodes[i].style.background = "";
                            Options.selectedShortcutKey = undefined;
                            setKeyDescription(true);

                            if (checkBoxReassign.checked) {
                                checkBoxReassign.checked = false;
                                writeReassignOptions();
                            }
                            return;
                        }
                    }
                    Options.selectedShortcutKey = result[i];
                    Options.selectedShortcutKey.index = i;

                    if (result[i].shortcut == '' && !notification) {
                        notification = showNotification(translate("noShortcutKeyAction"));
                        notification.onfinish = () => { notification = true; }
                    } else if (result[i].shortcut !== '' && typeof notification === "object") {
                        notification.close();
                    }

                    this.style.background = "var(--topColor)";
                    for (let j = 0; j < listsSortcutKeys.children.length; j++) {
                        if (j != i - 1) {
                            listsSortcutKeys.childNodes[j].style.background = "";
                        }
                    }

                    setKeyDescription(false, this, result[i]);
                    if (checkBoxReassign.checked) writeReassignOptions();
                }

                const keyDescription = result[i].description + " " + result[i].shortcut;
                const template = [
                    ["div", { class: "shortcut-key", onclick }, keyDescription]
                ];
                const shortcutKey = new Component(template).nodes[0];

                try {
                    if (Options.reassign.shortCut.index == i) {
                        // set shortcut if previously not set
                        Options.reassign.shortCut.shortcut = result[i].shortcut;
                        setKeyDescription(false, shortcutKey, result[i]);
                    }
                } catch (error) { }

                if (Options.reassign.isReassign) {
                    if (Options.reassign.shortCut.index == i) {
                        shortcutKey.style.background = "var(--topColor)";
                    }
                }

                listsSortcutKeys.appendChild(shortcutKey);
            }
        });
    }
});

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

document.querySelector("#GitHub").onclick = () => {
    window.open("https://github.com/Night-Soft/ControlYandexMusic");
}

whatNew.onclick = () => { 
    WhatNew.openNews();
};

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
    if (e.target !== modalListMenu) return;
    toggleListMenu();
}

hamburgerMenuList.onclick = () => {
    toggleListMenu();
}

let firstScroll = () => {
    if (!playlist.isInit && Player.info.tracks.length > 0) {
        requestIdleCallback(() => {
            EventEmitter.emit("playlistIsOpen");
        });
    }
}

let playlistToggleAnim = new ToggleAnimation(listTracks, {
    open: "slide-left",
    close: "slide-left-out",
});

let listMenuToggleAnim = new ToggleAnimation(modalListMenu, {
    open: "opacity",
    close: "opacity-reverse",
    display: {
        open: "flex",
        close: ""
    },
    onOpenEnd() { firstScroll() },
    onendRemove: false
});

let posTopToggleAnim = new ToggleAnimation(trackPositionTop, {
    close: "slide-left",
    open: "slide-left-out",
});

let posBottomToggleAnim = new ToggleAnimation(trackPositionBottom, {
    close: "slide-left",
    open: "slide-left-out",
});

let toggleListMenu = (toggle = !listMenuToggleAnim.isOpen) => {
    hamburgerMenuList.classList.remove ("change-list");
    hamburgerMenuList.classList.toggle("change-list", toggle);
    
    const action = toggle ? "open" : "close";
    playlistToggleAnim[action]();
    listMenuToggleAnim[action]();

    if (isTrackPosition === "top") posTopToggleAnim[action]();
    if (isTrackPosition === "bottom") posBottomToggleAnim[action]();
    return listMenuToggleAnim.isOpen;
}

let menuToggleAnim = new ToggleAnimation(containerMenu, {
    open: "slide-right",
    close: "slide-out",
});

let sideToggleAnim = new ToggleAnimation(document.getElementsByClassName("modal-side")[0], {
    open: "opacity",
    close: "opacity-reverse",
    display: {
        open: "block",
        close: "none"
    },
    onendRemove: false
});

let toggleMenu = () => {
    container.classList.toggle("change");
    menuToggleAnim.toggle();
    sideToggleAnim.toggle();
}

let setFontSize = (fontSize = 1.4) => {
    let heightArtist = artistsName[0].offsetHeight;
    let heightTrack = trackName[0].offsetHeight;

    if (heightArtist + heightTrack > 150) {
        fontSize = fontSize - 0.05;
        fontSize = fontSize.toFixed(2);
        artistsName[0].style.fontSize = fontSize + "rem";
        trackName[0].style.fontSize = fontSize + "rem";
        setFontSize(fontSize);
    }
}

EventEmitter.emit('Extension');
