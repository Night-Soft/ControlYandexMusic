let checkboxAllNotifications = document.getElementById('checkboxAllNotifications');
let playPauseNotify = document.getElementById('n1');
let prevNextNotify = document.getElementById('n2');
let checkBoxIncreaseCover = document.getElementById("n4");
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
    pxOrPercent: undefined,
    pinTab: undefined,
    positionStep: undefined,
    volumeStep: undefined,
    isAllNoifications: undefined,
    isPlayPauseNotify: undefined,
    isPrevNextNotify: undefined,
    isShowWhatNew: undefined,
    version: undefined,
    oldVersionDescription: undefined,
    isButtonsReduced: true,
    isSaveSizePopup: undefined,
    reassign: {
        isReassign: undefined,
        shortCut: undefined
    },
    defaultPopup: {
        pxOrPercent: false,
        width: 250,
        height: 110,
        maxWidth: window.screen.availWidth,
        maxHeight: window.screen.availHeight
    },
    popupBounds: undefined,
    selectedShortcutKey: undefined

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
            showMore.innerHTML = translate("showMore");
            gradients.classList.remove("show-gradients");
        } else {
            ThemesListState.isOpen = true;
            showMore.innerHTML = translate("hide");
            gradients.classList.add("show-gradients");
        }
        return;
    }

    showMore.innerHTML = "...";
    let result;
    try {
        result = await (await fetch("https://api.npoint.io/7584522679dbcdf3c2ef")).json();
        result = Object.entries(result);
    } catch (error) {
        ThemesListState.isCreated = false;
        showMore.innerHTML = "Error!";
        return;
    }
    const start = window.performance.now();
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
        setOptions({ theme: Options.theme });
    }
    const regex = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/g;

    ///
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
        return { gradientClass, styleGradient, name, style, }
    }

    gradients.appendChild(gradientContainer);
    const cssGradientIO = new Component([
        ["a", {
            href: "https://cssgradient.io/",
            "ev:click": function () { window.open(this.href) }
        }, "cssgradient.io"]
    ]).nodes[0];


    gradients.appendChild(cssGradientIO);

    showMore.innerHTML = translate("hide");
    gradients.classList.add("show-gradients");
    const end = window.performance.now();
    console.log("time to create", end - start);
    gradients.addEventListener("transitionend", () => {
        gradients.scrollIntoView({ block: "center", behavior: "smooth" });
        if (prevThemeSelected) {
            prevThemeSelected.scrollIntoView({ block: "center", behavior: "smooth" });
        }
    }, { once: true });


    ThemesListState.isCreated = true;
    ThemesListState.isOpen = true;
}

const writeOptions = (options) => {
    if (typeof options != "object") { throw new TypeError("The 'options' is not an 'object!'"); }
    sendEventBackground({ writeOptions: true, options });
}

pinTab.onclick = async () => {
    writeOptions({ pinTab: pinTab.checked });
    let { id: tabId, pinned } = await getYandexMusicTab("id", "pinned");
    const notificationBtn = { text: translate("yes") }
    let notification;
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

    if (checkboxSavePopupSize.checked) {
        const popupBounds = Options.popupBounds ? Options.popupBounds : Options.defaultPopup;
        ; ({ width, playlistHeight: height } = popupBounds);
        pxOrPercent = document.getElementById("PxOrPercentCheckbox").checked;
    } else {
        ; ({ width, height, pxOrPercent } = Options.defaultPopup);
    }

    if (pxOrPercent) {
        spanPxOrPercent[0].innerHTML = "%";
        spanPxOrPercent[1].innerHTML = "%"; 
        popupWidth.min = PopupSize.minWidthP;
        popupHeight.min = PopupSize.minHeightP;
        popupWidth.max = 100;
        popupHeight.max = 100;
        popupWidth.value = Math.round(width * 100 / PopupSize.width.max);
        popupHeight.value = Math.round(height * 100 / PopupSize.height.max);
    } else {
        spanPxOrPercent[0].innerHTML = "px";
        spanPxOrPercent[1].innerHTML = "px"; 
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

const savePopupSizeDelay = new ExecutionDelay(() => {
    writeOptions({ defaultPopup: Options.defaultPopup });
});

checkboxSavePopupSize.onclick = function () {
    updatePopupSize();
    writeOptions({ isSaveSizePopup: checkboxSavePopupSize.checked });
    setOptions({ isSaveSizePopup: checkboxSavePopupSize.checked });
}

pxOrPercent.onclick = function () {
    Options.defaultPopup.pxOrPercent = this.checked;
    savePopupSizeDelay.start();
    updatePopupSize();
}

const onPopupWidth = function (dimension, event) {
    event.preventDefault();

    if (event.deltaY != undefined) {
        if (event.deltaY < 0) {
            this.value = Number(this.value) + 1;
        } else {
            this.value = Number(this.value) - 1;
        }
    }

    if (this.value > this.max) this.value = this.max; 
    let value = parseInt(this.value)
    if (pxOrPercent.checked) {
        Options.defaultPopup[dimension] = Math.floor(value * PopupSize[dimension].max / 100);
    } else {
        Options.defaultPopup[dimension] = value;
    }
    savePopupSizeDelay.start();
}
const onPopupWidthBinded = onPopupWidth.bind(popupWidth, "width");
popupWidth.oninput = onPopupWidthBinded;
popupWidth.onwheel = onPopupWidthBinded;

const onPopupHeightBinded = onPopupWidth.bind(popupHeight, "height");
popupHeight.oninput = onPopupHeightBinded;
popupHeight.onwheel = onPopupHeightBinded;

const sendSliderStepDelay = new ExecutionDelay((options) => {
    writeOptions(options);
    setOptions(options)
});

const onSliderStep = function (slider, event) {
    event.preventDefault();
    if (event.deltaY < 0) {
        this.value = Number(this.value) + 1;
    } else {
        this.value = Number(this.value) - 1;
    }
    if (Number(this.value) > Number(this.max)) { this.value = this.max; }
    if (Number(this.value) < Number(this.min)) { this.value = this.min; }

    const previousArgs = sendSliderStepDelay.getFunction().arguments?.[0];
    const currentArgs = { [`${slider}Step`]: Number(this.value) }
    if (typeof previousArgs === 'object' && sendSliderStepDelay.isStarted === true) {
        if (Object.keys(previousArgs)[0] !== Object.keys(currentArgs)[0]) {
            sendSliderStepDelay.execute();
        }
    }
    sendSliderStepDelay.setArgumetns(currentArgs).start();
}

const onPositionStep = onSliderStep.bind(positionStep, "position");
positionStep.oninput = onPositionStep;
positionStep.onwheel = onPositionStep;

const onVolumeStep = onSliderStep.bind(volumeStep, "volume");
volumeStep.oninput = onVolumeStep;
volumeStep.onwheel = onVolumeStep;

const toggleSetCurrentSizeBtn = function () {
    getPopupWindowId().then((windowId) => {
        savePopupSize.innerHTML = translate(windowId ? "useCurrnetSize" : "usePrevSize");
    });
}

checkboxAllNotifications.onclick = () => {
    writeOptions({ isAllNoifications: checkboxAllNotifications.checked });
    setOptions({ isAllNoifications: checkboxAllNotifications.checked });
}

playPauseNotify.onclick = () => {
    writeOptions({ isPlayPauseNotify: playPauseNotify.checked });
    setOptions({ isPlayPauseNotify: playPauseNotify.checked });
}

prevNextNotify.onclick = () => {
    writeOptions({ isPrevNextNotify: prevNextNotify.checked });
    setOptions({ isPrevNextNotify: prevNextNotify.checked });
}

defaultTheme.onclick = () => {
    writeOptions({ theme: { name: "default" } });
    setOptions({ theme: { name: "default" } });
}

lightTheme.onclick = () => {
    writeOptions({ theme: { name: "light" } });
    setOptions({ theme: { name: "light" } });
}

darkTheme.onclick = () => {
    writeOptions({ theme: { name: "dark" } });
    setOptions({ theme: { name: "dark" } });
}
otherTheme.onclick = () => {
    if (Options.theme.index) {
        if (ThemesListState.isOpen) {
            if(prevThemeSelected) {
                prevThemeSelected.scrollIntoView({ block: "center", behavior: "smooth" });
            }
        } else {
            // to do
            if (ThemesListState.isCreated === false) {
                showMore.onclick();
            } else {
                showMore.onclick();
                prevThemeSelected.scrollIntoView({ block: "center", behavior: "smooth" });
            }
        }
        return;
    }
    writeOptions({ theme: OtherTheme });
    setOptions({ theme: OtherTheme });
}

checkBoxIncreaseCover.onclick = function () {
    writeOptions({ isButtonsReduced: checkBoxIncreaseCover.checked });
    setOptions({ isButtonsReduced: checkBoxIncreaseCover.checked });
}
checkBoxDislikeButton.onclick = function () {
    writeOptions({ isDislikeButton: checkBoxDislikeButton.checked });
    setOptions({ isDislikeButton: checkBoxDislikeButton.checked });
}

checkBoxReassign.onclick = function () {
    const reassign = {
        isReassign: checkBoxReassign.checked,
        shortCut: Options.selectedShortcutKey
    }
    if (checkBoxReassign.checked) {
        if (Options.selectedShortcutKey != undefined) {
            writeOptions({ reassign });
            setOptions({ reassign });
        } else {
            checkBoxReassign.checked = false;
            showNotification(chrome.i18n.getMessage("noShortcutSelected"));
        }
    } else {
        reassign.shortCut = undefined;
        setKeyDescription(true);
        writeOptions({ reassign } );
        setOptions({ reassign });
    }
}

// now the shortcut key which uses as play/ pause will be used for open popup;
// check new version and show what new
let checkNew = () => {
    if (Options.isShowWhatNew !== true) return;
    WhatNew.openNews(); 
    Options.isShowWhatNew = false;
    writeOptions({ isShowWhatNew: false });
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
        if (typeof options.theme == "string") { // remove on next update
            Options.theme.name = options.theme;
            setTheme(options.theme);
        } else {
            Options.theme = options.theme;
            setTheme(options.theme.name);
        }
    }
    if (options.isCoverIncrease != undefined) { // remove on next update
        chrome.storage.local.remove("isCoverIncrease");
        writeOptions({ isButtonsReduced: options.isCoverIncrease })
        Options.isButtonsReduced = options.isCoverIncrease;
        checkBoxIncreaseCover.checked = options.isCoverIncrease;
        toggleCoverSize(options.isCoverIncrease);
    } 
    if (options.isButtonsReduced != undefined) { 
        Options.isButtonsReduced = options.isButtonsReduced;
        checkBoxIncreaseCover.checked = options.isButtonsReduced;
        toggleCoverSize(options.isButtonsReduced);
    } else if (options.hasOwnProperty("isButtonsReduced")) { toggleCoverSize(true); }

    if (options.isShowWhatNew != undefined) {
        Options.isShowWhatNew = options.isShowWhatNew;
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
            toggleCoverSize(true);
            checkBoxIncreaseCover.checked = true;
            dislike.style.display = "block";
            disableOptions(contentLabel[4], !checkBoxDislikeButton.checked);
        } else {
            dislike.style.display = "none";
            disableOptions(contentLabel[4], !checkBoxDislikeButton.checked);
            if (Options.isButtonsReduced == false) {
                toggleCoverSize(false);
                checkBoxIncreaseCover.checked = false;
            }
        }
    }
    if (options.isSaveSizePopup != undefined) {
        checkboxSavePopupSize.checked = options.isSaveSizePopup;
        Options.isSaveSizePopup = options.isSaveSizePopup;
        if (Options.isSaveSizePopup) {
            disableOptions(setupPopupSize);
            spanPopupSize.innerHTML = translate("previousPopupSize");
        } else {
            disableOptions(setupPopupSize, true);
            spanPopupSize.innerHTML = translate("defaultPopupSize");
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
}

chrome.runtime.sendMessage({ getOptions: true }, function (response) {
    if (response != undefined && response.options) {
        EventEmitter.on("Options", () => {
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



