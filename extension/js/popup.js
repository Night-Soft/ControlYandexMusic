if (Extension.windowName == "side-panel") {
    document.getElementsByClassName("popup-btn")[0].onclick = createPopup;
    sendEventBackground({ sidePanel: true });
}

if (Extension.windowName == "popup") {
    const properties = ["id", "tabs", "focused", "type", "state", "incognito", "alwaysOnTop"];
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
            properties.forEach(property => Reflect.deleteProperty(ev, property));
            Options.popupBounds = ev;
            sendEventBackground({ savePopupBounds: ev });
        }
    }, { delay: 200 });
    chrome.windows.onBoundsChanged.addListener(boundsChanged.start.bind(boundsChanged));

    const popupClosed = sendEventBackground.bind(null, { popupClosed: true });
    window.addEventListener("beforeunload", popupClosed);
}

let PopupWindow = class {
    constructor() {
        if (!PopupWindow.instance) {
            PopupWindow.instance = this;
        } else {
            return PopupWindow.instance
        }
        this.x = 0;
        this.y = 0;
        this.windowId;
        getPopupWindowId().then((windowId)=>{
            if (windowId) {
                this.windowId = windowId;
                sendEventBackground({ popupCreated: { id: this.windowId } });
            }
        });
        this.correctMinSize();
    }

    #width = 250;
    #height = 110;
    #playlistHeight = 270;
    #isPlaylistOpen = false;
    correctMinSize() {
        const height = window.innerHeight < 110 ? true : false;
        const width = window.innerWidth < 250 ? true : false;
        if (height && width) {
            window.resizeTo(250, 110);
            return;
        }
        if (height) {
            window.resizeTo(window.innerWidth, 110);
            return;
        }
        if (width) {
            window.resizeTo(250, window.innerHeight);
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
            EventEmitter.emit("playlistIsOpen");
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
    hamburgerMenuList.onclick = () => { 
        togglePlaylist();
        Options.popupBounds.isTrackListOpen = popupWindow.isPlaylistOpen;
        sendEventBackground({ savePopupBounds: Options.popupBounds });
     }
} else {
    if (Extension.windowName == "side-panel") {
        togglePlaylist(true);
    }
}

//END EXTENSION

// START OPTIONS
let Options = {
    theme: {},
    positionStep: undefined,
    volumeStep: undefined,
    popupBounds: undefined,
    isSaveSizePopup: undefined
}


let setOptions = (options) => {
    if (options.positionStep != undefined) {
        Options.positionStep = options.positionStep;
        if (typeof sliderProgress != "undefined") {
            sliderProgress.wheelStep = options.positionStep;
        }
    }
    if (options.volumeStep != undefined) {
        Options.volumeStep = options.volumeStep;
        if (typeof sliderVolume != "undefined") {
            sliderVolume.wheelStep = options.volumeStep;
        }
    }
    if (options.theme != undefined) {
        Options.theme = options.theme;
        setTheme(options.theme.name, Extension.windowName);
    }

    if (options.isDislikeButton != undefined) {
        Options.isDislikeButton = options.isDislikeButton;
        if (options.isDislikeButton) {
            dislike.style.display = "block";
        } else {
            dislike.style.display = "none";
        }
    }
    if (Extension.windowName == "popup") {
        if (options.hasOwnProperty("isSaveSizePopup") && options.hasOwnProperty("writeOptions") === false) {
            if (options.isSaveSizePopup === false || options.isSaveSizePopup === undefined) {
                Options.isSaveSizePopup = options.isSaveSizePopup;
                popupWindow.playlistHeight = window.innerHeight;
                popupWindow.width = window.innerWidth;
                popupWindow.height = window.innerHeight;
            }
            if (options.popupBounds != undefined) {
                Options.popupBounds = options.popupBounds;
                if (options.isSaveSizePopup) {
                    popupWindow.playlistHeight = options.popupBounds.playlistHeight;
                    popupWindow.height = options.popupBounds.height;
                }
                if (options.popupBounds.isTrackListOpen || options.popupBounds.isTrackListOpen == undefined) {
                    // to do:
                    // popupWindow.height = options.popupBounds.height;
                    
                    togglePlaylist(true);
                    return;
                }
            }
        }
        popupWindow.correctMinSize();
        rootCss.style.setProperty('--transitionDuration', '0.7s');
    }
}
// END OPTIONS
sendEventBackground({ getOptions: true }, setOptions);
Extension.onload();