let checkboxAllNotifications = document.getElementById('checkboxAllNotifications');
let playPauseNotify = document.getElementById('n1');
let prevNextNotify = document.getElementById('n2');
let checkBoxDislikeButton = document.getElementById("n5");
let checkboxSavePopupSize = document.getElementById("n6");
let checkBoxReassign = document.getElementById("n7");
let pinTab = document.getElementById("checkboxPinTab");
let pxOrPercent = document.getElementById("PxOrPercentCheckbox");
let savePopupSize = document.getElementById("SavePopupSize");

let defaultTheme = document.getElementById("DefaultTheme");
let lightTheme = document.getElementById("LightTheme");
let darkTheme = document.getElementById("DarkTheme");

let grooveBox = document.querySelector(".groove-box");
let contentReassign = document.getElementsByClassName("content-reassign")[0];
let contentLabel = document.getElementsByClassName("content-label");

let positionStep = document.getElementById("PositionStep");
let volumeStep = document.getElementById("VolumeStep");
let spanPxOrPercent = document.getElementsByClassName("span-px");
let popupWidth = document.getElementById("PopupWidth");
let popupHeight = document.getElementById("PopupHeight");
let prevThemes = document.getElementsByClassName('prev-themes')[0]
let gradients = document.getElementsByClassName("gradients")[1];
let showMore = document.getElementById("ShowMore");
let otherTheme = document.getElementById("OtherTheme");
let otherThemeName = document.getElementById("OtherThemeName");
let spanPopupSize = document.getElementById("CurrnetPopupSize");
let setupPopupSize = document.getElementById("SetupPopupSize");


let prevThemeSelected;

let Options = {
    theme: { name:"default"},
    pinTab: undefined,
    positionStep: undefined,
    volumeStep: undefined,
    isAllNoifications: undefined,
    isPlayPauseNotify: undefined,
    isPrevNextNotify: undefined,
    isNewFeaturesShown: undefined,
    version: undefined,
    oldVersionDescription: undefined,
    isSaveSizePopup: undefined,
    reassign: {
        isReassign: undefined,
        shortCut: undefined
    },
    defaultPopup: {
        pxOrPercent: false,
        width: 380,
        height: 580,
        maxWidth: window.screen.availWidth,
        maxHeight: window.screen.availHeight
    },
    popupBounds: undefined,
    selectedShortcutKey: undefined,
    isOpenInCurrentTab: undefined
};

const ThemesListState = {
    isCreated: false,
    isOpen: false
}

const DataStorage = new WeakMap();

showMore.onclick = async () => {
    if (ThemesListState.isCreated) {
        if (ThemesListState.isOpen) {
            ThemesListState.isOpen = false;
            showMore.innerText = translate("showMore");
            gradients.classList.remove("show-gradients");
        } else {
            ThemesListState.isOpen = true;
            showMore.innerText = translate("hide");
            gradients.classList.add("show-gradients");
        }
        return;
    }

    showMore.innerText = "...";
    let result;
    try {
        result = await (await fetch("https://api.npoint.io/7584522679dbcdf3c2ef")).json();
        result = Object.entries(result);
    } catch (error) {
        ThemesListState.isCreated = false;
        showMore.innerText = "Error!";
        return;
    }

    const gradientContainer = new Component([["div", { class: "gradient-container" }]]).nodes[0];

    const onclick = function () {
        const { gradientStr, index, name, textColor } = DataStorage.get(this);
        if (prevThemeSelected) {
            prevThemeSelected.classList.remove("user-theme-selected");
        }
        this.classList.add("user-theme-selected");
        prevThemeSelected = this;

        Options.theme.gradient = gradientStr;
        Options.theme.index = index;
        Options.theme.name = name;
        Options.theme.color = textColor;
        writeOptions({ theme: Options.theme });
    }
    const regex = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/g;

    const template = [
        ["div", { "ev:click": onclick, class: "{{gradientClass}}", style: "{{styleGradient}}" },
            ["span", { class: "gradient-name", style: "{{style}}" }, "{{name}}"]]
    ];

    const gradient = new Component(template, result, predicate);
    gradient.appendToElement(gradientContainer);

    function predicate({ value, index }, element) {
        const [name, gradientStr] = value;
        const [topColor] = [...gradientStr.matchAll(regex)].map(value => {
            return [value[1], value[2], value[3]].map(value => Number(value));
        });

        const textColor = getTextColor(topColor);
        const styleGradient = { background: gradientStr };
        let style = { color: "" };
        if (textColor == "dark") {
            style.color = Themes.light.color;
        } else {
            style.color = Themes.dark.colors.white;
        }

        const gradientClass = ["gradient"];
        if (index === Options.theme.index) {
            gradientClass.push("user-theme-selected");
            prevThemeSelected = element;
        }

        DataStorage.set(element, { gradientStr, index, name, textColor });
        return { gradientClass, styleGradient, name, style }
    }

    gradients.appendChild(gradientContainer);
    const cssGradientIO = new Component([
        ["a", {
            href: "https://cssgradient.io/",
            "ev:click": function () { window.open(this.href) }
        }, "cssgradient.io"]
    ]).nodes[0];


    gradients.appendChild(cssGradientIO);

    showMore.innerText = translate("hide");
    
    gradients.classList.add("show-gradients");
    gradients.addEventListener("transitionend", () => {
        gradients.scrollIntoView({ block: "center", behavior: "smooth" });
        if (prevThemeSelected) {
            prevThemeSelected.scrollIntoView({ block: "center", behavior: "smooth" });
        }
    }, { once: true });


    ThemesListState.isCreated = true;
    ThemesListState.isOpen = true;
}

pinTab.onclick = async () => {
    writeOptions({ pinTab: pinTab.checked }, false);

    let notification;
    let { id: tabId, pinned } = await getYandexMusicTab("id", "pinned");
    const notificationBtn = { text: translate("yes") }
    
    if (pinTab.checked && pinned === false) {
        notification = showNotification(translate("pinTabNow"), 7000);
        notificationBtn.onclick = async () => {
            pinned = (await chrome.tabs.update(tabId, { pinned: !pinned })).pinned;
            notification.text = translate(pinned ? "tabPinned" : "pinTabNow");
            notification.button.text = translate(pinned ? "cancel" : "yes");
        }
        notification.button = notificationBtn;
    }
    
    if (!pinTab.checked && pinned === true) {
        notification = showNotification(translate("unpinTab"), 7000);
        notificationBtn.onclick = async () => {
            pinned = (await chrome.tabs.update(tabId, { pinned: !pinned })).pinned;
            notification.text = translate(pinned ? "unpinTab" : "tabUnpinned");
            notification.button.text = translate(pinned ? "yes" : "cancel");
        }
        notification.button = notificationBtn
    }
}

const PopupSize = {
    minWidth: 250,
    minHeight: 110,
    width: {
        min: 250,
        max: window.screen.availWidth,
    },
    height:{
        min: 110,
        max:  window.screen.availHeight,
    },
    minWidthP: Math.ceil(250 * 100 / window.screen.availWidth), // percent
    minHeightP: Math.ceil(100 * 100 / window.screen.availHeight), // percent
}

const updatePopupSize = () => {
    let width, height, pxOrPercent;

    if (checkboxSavePopupSize.checked && Options.popupBounds) {
        ; ({ width, playlistHeight: height } = Options.popupBounds);
    } else {
        ; ({ width, height } = Options.defaultPopup);
    }

    pxOrPercent = document.getElementById("PxOrPercentCheckbox").checked;

    if (pxOrPercent) {
        spanPxOrPercent[0].innerText = "%";
        spanPxOrPercent[1].innerText = "%"; 
        popupWidth.min = PopupSize.minWidthP;
        popupHeight.min = PopupSize.minHeightP;
        popupWidth.max = 100;
        popupHeight.max = 100;
        popupWidth.value = Math.round(width * 100 / PopupSize.width.max);
        popupHeight.value = Math.round(height * 100 / PopupSize.height.max);
    } else {
        spanPxOrPercent[0].innerText = "px";
        spanPxOrPercent[1].innerText = "px"; 
        popupWidth.min = PopupSize.width.min;
        popupHeight.min = PopupSize.height.min;
        popupWidth.max = PopupSize.width.max;
        popupHeight.max = PopupSize.height.max;
        popupWidth.value = width;
        popupHeight.value = height;
    }
}

popupWidth.min = PopupSize.width.min;
popupHeight.min = PopupSize.height.min;
popupWidth.max = PopupSize.width.max;
popupHeight.max = PopupSize.height.max;

checkboxSavePopupSize.onclick = function () {
    updatePopupSize();
    writeOptions({ isSaveSizePopup: checkboxSavePopupSize.checked });
}

pxOrPercent.onclick = function () {
    Options.defaultPopup.pxOrPercent = this.checked;
    savePopupSizeDelay.start();
    updatePopupSize();
}

const savePopupSizeDelay = new ExecutionDelay(() => {
    writeOptions({ defaultPopup: Options.defaultPopup }, false);
});

const sendSliderStepDelay = new ExecutionDelay((options) => {
    sendSliderStepDelay.clearArguments();
    writeOptions(options);
});

const onWheel = function (event) {
    event.preventDefault();

    if (event.deltaY != undefined) {
        if (event.deltaY < 0) {
            this.value = Number(this.value) + 1;
            if (Number(this.value) > Number(this.max)) this.value = this.max;

        } else {
            this.value = Number(this.value) - 1;
            if (Number(this.value) < Number(this.min)) this.value = this.min;
        }
    }
}

const onfocusout = function (input) {
    this.onwheel = null;
    
    let value = parseInt(this.value);
    let isAnim = false;

    if (value > parseInt(this.max)) {
        this.value = this.max;
        isAnim = true;
    } 
    if (value < parseInt(this.min)) {
        this.value = this.min;
        isAnim = true;
    } 

    if (isAnim) {
        const red = "rgb(219, 0, 0)";
        const topColor = document.querySelector(":root").style.getPropertyValue("--topColor");
        this.animate({
            backgroundColor: [topColor, red, topColor, red, topColor, red, topColor],
        }, { duration: 2000 });
    }

    value = parseInt(this.value);
    if (input === "width" || input === "height") {
        if (pxOrPercent.checked) {
            Options.defaultPopup[input] = Math.floor(value * PopupSize[input].max / 100);
        } else {
            Options.defaultPopup[input] = value;
        }
        savePopupSizeDelay.start();
        return;
    }

    if (input === "position" || input === "volume") {
        let options = sendSliderStepDelay.getFunction().arguments?.[0];
        if (options) {
            options[`${input}Step`] = value;
        } else {
            options = { [`${input}Step`]: value };
        }
        let send = false
        Object.entries(options).forEach(([key])=> {
            if(options[key] !== Options[key]) send = true;
        });
        send && sendSliderStepDelay.setArgumetns(options).start();
    }
}

popupWidth.addEventListener("focus", () => { popupWidth.onwheel = onWheel });
popupWidth.addEventListener("focusout", onfocusout.bind(popupWidth, "width"));

popupHeight.addEventListener("focus", () => { popupHeight.onwheel = onWheel });
popupHeight.addEventListener("focusout", onfocusout.bind(popupHeight, "height"));

positionStep.addEventListener("focus", () => { positionStep.onwheel = onWheel });
positionStep.addEventListener("focusout", onfocusout.bind(positionStep, "position"));

volumeStep.addEventListener("focus", () => { volumeStep.onwheel = onWheel });
volumeStep.addEventListener("focusout", onfocusout.bind(volumeStep, "volume"));

const toggleSetCurrentSizeBtn = function () {
    getPopupWindowId().then((windowId) => {
        savePopupSize.innerText = translate(windowId ? "useCurrnetSize" : "usePrevSize");
    });
}

checkboxAllNotifications.onclick = () => {
    writeOptions({ isAllNoifications: checkboxAllNotifications.checked });
}

playPauseNotify.onclick = () => {
    writeOptions({ isPlayPauseNotify: playPauseNotify.checked });
}

prevNextNotify.onclick = () => {
    writeOptions({ isPrevNextNotify: prevNextNotify.checked });
}

defaultTheme.onclick = () => {
    writeOptions({ theme: { name: "default" } });
}

lightTheme.onclick = () => {
    writeOptions({ theme: { name: "light" } });
}

darkTheme.onclick = () => {
    writeOptions({ theme: { name: "dark" } });
}

otherTheme.onclick = () => {
    if (Options.theme.index) {
        if (ThemesListState.isOpen) {
            if(prevThemeSelected) {
                prevThemeSelected.scrollIntoView({ block: "center", behavior: "smooth" });
            }
        } else {
            showMore.onclick();
            if (ThemesListState.isCreated === false)  return;
            prevThemeSelected.scrollIntoView({ block: "center", behavior: "smooth" });
        }
        return;
    }
    writeOptions({ theme: OtherTheme });
}

checkBoxDislikeButton.onclick = function () {
    writeOptions({ isDislikeButton: checkBoxDislikeButton.checked });
}

checkBoxReassign.onclick = function () {
    const reassign = {
        isReassign: checkBoxReassign.checked,
        shortCut: Options.selectedShortcutKey
    }
    if (checkBoxReassign.checked) {
        if (Options.selectedShortcutKey != undefined) {
            writeOptions({ reassign });
        } else {
            checkBoxReassign.checked = false;
            showNotification(chrome.i18n.getMessage("noShortcutSelected"));
        }
    } else {
        reassign.shortCut = undefined;
        setKeyDescription(true);
        writeOptions({ reassign } );
    }
}

let checkNew = () => {
    if (Options.isNewFeaturesShown !== true) return;
    //WhatNew.openNews(); // todo: remove //
}

let setOptions = (options) => {
    if (options.positionStep != undefined) { 
        positionStep.value = options.positionStep; 
        Options.positionStep = options.positionStep;
        if (typeof sliderProgress != "undefined") {
            sliderProgress.wheelStep = options.positionStep;
        }
    } 
    if (options.volumeStep != undefined) { 
        volumeStep.value = options.volumeStep; 
        Options.volumeStep = options.volumeStep;
        if(typeof sliderVolume != "undefined") {
            sliderVolume.wheelStep = options.volumeStep;
        }
    }
    if (options.defaultPopup !== undefined) {
        Options.defaultPopup  = options.defaultPopup;
        if (Options.defaultPopup.pxOrPercent) {
            pxOrPercent.checked = true;
        }
        updatePopupSize();
    } 
    if (options.pinTab !== undefined) {
        pinTab.checked = options.pinTab ? true : false;
        Options.pinTab  = options.pinTab ? true : false;
    }    
    if (options.isAllNoifications != undefined) {
        checkboxAllNotifications.checked = options.isAllNoifications;
        Options.isAllNoifications = options.isAllNoifications;
        disableOptions(contentLabel[3], !checkboxAllNotifications.checked);
    }
    if (options.isPlayPauseNotify != undefined) {
        playPauseNotify.checked = options.isPlayPauseNotify;
        Options.isPlayPauseNotify = options.isPlayPauseNotify;
    }
    if (options.isPrevNextNotify != undefined) {
        prevNextNotify.checked = options.isPrevNextNotify;
        Options.isPrevNextNotify = options.isPrevNextNotify;
    }
    if (options.theme != undefined) {
        if (typeof options.theme == "string") { //todo: remove on next update
            Options.theme.name = options.theme;
            setTheme(options.theme);
        } else {
            Options.theme = options.theme;
            setTheme(options.theme.name);
        }
    }
    if (options.isNewFeaturesShown != undefined) {
        Options.isNewFeaturesShown = options.isNewFeaturesShown;
    }
    if (options.version != undefined) {
        Options.version = options.version;
        rootCss.style.setProperty('--transitionDuration', '0.7s');
    }
    if (options.oldVersionDescription != undefined) {
        Options.oldVersionDescription = options.oldVersionDescription;
    }
    if (options.isDislikeButton != undefined) {
        Options.isDislikeButton = options.isDislikeButton;
        checkBoxDislikeButton.checked = options.isDislikeButton;
        if (options.isDislikeButton) {
            dislike.style.display = "block";
        } else {
            dislike.style.display = "none";
        }
    }
    if (options.isSaveSizePopup != undefined) {
        checkboxSavePopupSize.checked = options.isSaveSizePopup;
        Options.isSaveSizePopup = options.isSaveSizePopup;
        if (Options.isSaveSizePopup) {
            disableOptions(setupPopupSize);
            spanPopupSize.innerText = translate("previousPopupSize");
        } else {
            disableOptions(setupPopupSize, true);
            spanPopupSize.innerText = translate("defaultPopupSize");
        }
    }
    if (options.popupBounds != undefined) {
        Options.popupBounds = options.popupBounds;
        if (Options.isSaveSizePopup) {
            updatePopupSize();
        }
    }
    if (options.reassign != undefined) {
        Options.reassign.isReassign = options.reassign.isReassign;
        Options.reassign.shortCut = options.reassign.shortCut;
        checkBoxReassign.checked = options.reassign.isReassign;
        Options.selectedShortcutKey = options.reassign.shortCut;
    }
    if (options.isOpenInCurrentTab != undefined) {
        Options.isOpenInCurrentTab = options.isOpenInCurrentTab;
        document.querySelector("#checkboxOpenCurTab").checked = options.isOpenInCurrentTab;
     }
}

getOptions((response) => {
    if (response.options) {
        EventEmitter.on("Options", () => { // todo check EventEmitter "Options"
            if (typeof Extension == 'object') {
                setOptions(response.options); // options.js
                checkNew();
            } else {
                EventEmitter.on("Extension", () => {
                    setOptions(response.options); // options.js
                    checkNew();
                });
            }
        });
    }
});

EventEmitter.on("Extension", () => { Extension.onload() });
EventEmitter.on("Translate", () => { Translate.onload() });
EventEmitter.emit('Options');



