if (Extension.windowName == "side-panel") {
    document.getElementsByClassName("popup-btn")[0].onclick = createPopup;
    sendEventBackground({ sidePanel: true });
}

if (Extension.windowName == "popup") {
    const boundsChanged = new ExecutionDelay((ev) => {
        if (popupWindow.windowId == ev.id) {
            ev.isTrackListOpen = popupWindow.isPlaylistOpen;
            if (popupWindow.isPlaylistOpen == true) {
                ev.height = popupWindow.height;
                popupWindow.playlistHeight = window.innerHeight;
                ev.playlistHeight = popupWindow.playlistHeight - popupWindow.frameHeight;
            } else {
                ev.height = window.innerHeight;
                popupWindow.height = window.innerHeight;
                ev.playlistHeight = popupWindow.playlistHeight - popupWindow.frameHeight;
            }
            sendEventBackground({ savePopupBounds: ev });
        }
    }, { delay: 200 });

    chrome.windows.onBoundsChanged.addListener(boundsChanged.start.bind(boundsChanged));
}

let PopupWindow = class {
    constructor() {
        if (!PopupWindow.instance) {
            PopupWindow.instance = this;
        } else {
            return PopupWindow.instance
        }

        let windows = chrome.windows.getAll({ populate: true, windowTypes: ['popup'] });
        windows.then((result) => {
            if (result.length) {
                let windowUrl;
                for (let i = 0; i < result.length; i++) {
                    windowUrl = result[i].tabs[0].url;
                    if (windowUrl.includes(chrome.runtime.id + "/popup.html")) {
                        this.windowId = result[i].tabs[0].windowId;
                    }
                }
            } else {
                this.windowId = undefined;
            }
        }, (reject) => { });

        this.x = 0;
        this.y = 0;
        this.windowId;
        this.correctMinSize();
    }

    #width = 250;
    #height = 110;
    #playlistHeight = 270;
    #isPlaylistOpen = false;
    correctMinSize() {
        if (window.innerHeight < 110) {
            window.resizeTo(this.width, this.height);
        }
    }
    resizeTo(width, height) {
        if (width == window.innerWidth && height == window.innerHeight) return;
        window.resizeTo(width, height);
    }
    get isPlaylistOpen() {
        return this.#isPlaylistOpen;
    }
    set isPlaylistOpen(value) {
        if (typeof value === 'boolean') {
            this.#isPlaylistOpen = value;
        }
    }
    get width() {
        if (window.outerWidth < 250 + this.frameWidth) {
            return 250 + this.frameWidth;
        }
        return window.outerWidth; // + this.frameWidth;
    }
    set width(value) {
        if (!Number.isInteger(value)) return;
        this.#width = value + this.frameWidth;
    }

    get height() {
        if (this.#height < 110 + this.frameHeight) {
            return 110 + this.frameHeight;
        }
        return this.#height;
    }
    set height(value) {
        if (!Number.isInteger(value)) return;
        this.#height = value + this.frameHeight;
    }

    get playlistHeight() {
        if (this.#playlistHeight < 270 + this.frameHeight) {
            return 270 + this.frameHeight;
        }
        return this.#playlistHeight;
    }
    set playlistHeight(value) {
        if (!Number.isInteger(value)) return;
        this.#playlistHeight = value + this.frameHeight;
    }

    get frameHeight() {
        return window.outerHeight - window.innerHeight;
    }
    get frameWidth() {
        return window.outerWidth - window.innerWidth;
    }

}
let popupWindow = new PopupWindow();

let list = document.getElementById("listTrack");
/** @param {boolean} show show playlist or hide  */
let togglePlaylist = (show) => {
    if (show == undefined) { show = !popupWindow.isPlaylistOpen; }
    if (typeof hamburgerMenuList != "undefined") {
        hamburgerMenuList.classList.toggle("change-list", show);
        let keyframeHamburger = { opacity: ['1', '0'] };
        let optionsHamburger = { duration: 450 };
        let animH = hamburgerMenuList.animate(keyframeHamburger, optionsHamburger);
        if (show) {
            animH.onfinish = () => {
                hamburgerMenuList.classList.add("playlist-open");
                hamburgerMenuList.style.top = "120px";
                hamburgerMenuList.style.right = "10px";
                keyframeHamburger = { opacity: ['0', '1'] };
                hamburgerMenuList.animate(keyframeHamburger, optionsHamburger);
            }
        } else {
            animH.onfinish = () => {
                hamburgerMenuList.classList.remove("playlist-open");
                hamburgerMenuList.style.top = "0px";
                hamburgerMenuList.style.right = "";
                keyframeHamburger = { opacity: ['0', '1'] };
                hamburgerMenuList.animate(keyframeHamburger, optionsHamburger);
            }
        }
    }
    if (show) {
        popupWindow.x = screenLeft;
        popupWindow.y = screenTop;
        //popupWindow.height = window.innerHeight;
        popupWindow.resizeTo(popupWindow.width, popupWindow.playlistHeight);

        keyframe = {
            height: ['0px', '100vh'],
            easing: ['cubic-bezier(.85, .2, 1, 1)']
        };

        let options = { duration: 500 }
        list.style.overflowY = "hidden"
        list.style.display = "flex";
        let anim = list.animate(keyframe, options);
        popupWindow.isPlaylistOpen = true;
        anim.onfinish = () => {
            list.style.height = "auto";
            list.style.overflowY = "auto";
            scrollToSelected();
        }
        // playlist open
    } else {
        keyframe = {
            height: ['100vh', '0px'],
            easing: ['cubic-bezier(.85, .2, 1, 1)']
        };

        let options = { duration: 500 }
        list.style.overflowY = "hidden"
        let anim = list.animate(keyframe, options);
        popupWindow.isPlaylistOpen = false;
        anim.onfinish = () => {
            list.style.display = "none";
            popupWindow.resizeTo(popupWindow.width, popupWindow.height);
            if (popupWindow.x != screenLeft) {
                window.moveTo(screenLeft, screenTop);
                return;
            }
            window.moveTo(popupWindow.x, popupWindow.y);
            anim.onfinish = null;
        }
        // playlist close
    }
}

if (typeof hamburgerMenuList != "undefined") {
    hamburgerMenuList.onclick = () => { togglePlaylist(); }
} else {
    if (Extension.windowName == "side-panel") {
        togglePlaylist(true);
    }
}

//END EXTENSION

// START OPTIONS
let Options = {
    onload: function () {
        sendEventBackground({ getOptions: true }, setOptions);
    },
    isPlayPauseNotify: undefined,
    isPrevNextNotify: undefined,
    isShowWhatNew: undefined,
    version: undefined,
    oldVersionDescription: undefined,
    isReduce: false,
    popupBounds: undefined
};

let setOptions = (options) => {
    if (options.theme != undefined) {
        switch (options.theme) {
            case "default":
                Options.theme = options.theme;
                setTheme("default", Extension.windowName);
                break;
            case "light":
                Options.theme = options.theme;
                setTheme("light", Extension.windowName);
                break;
            case "dark":
                Options.theme = options.theme;
                setTheme("dark", Extension.windowName);
                break
        }
    }
    if (options.isDarkTheme != undefined) { // remove it on next update
        Options.isDarkTheme = options.isDarkTheme;
        if (options.isDarkTheme == true) {
            setDarkTheme("dark");
        }
    }
    if (options.isCoverIncrease != undefined) {
        Options.isCoverIncrease = options.isCoverIncrease;
        try {
            if (options.isCoverIncrease) {
                setIncreaseCover(true);
            } else {
                setIncreaseCover(false);
            }
        } catch (error) { console.log(error) }
    }
    if (options.isDislikeButton != undefined) {
        Options.isDislikeButton = options.isDislikeButton;
        if (options.isDislikeButton) {
            dislike.style.display = "block";
            setIncreaseCover(true);
        } else {
            dislike.style.display = "none";
            if (Options.isCoverIncrease == false) {
                setIncreaseCover(false);
            }
        }
    }
    if (options.popupBounds != undefined) {
        Options.popupBounds = options.popupBounds;
        //this
        popupWindow.playlistHeight = options.popupBounds.playlistHeight;
        popupWindow.height = options.popupBounds.height;
        if (options.popupBounds.isTrackListOpen) {
            if (Extension.windowName == "popup") {
                togglePlaylist(true);
            }
            return;
        }
        popupWindow.correctMinSize();
    }
}
// END OPTIONS
Options.onload();
Extension.onload();