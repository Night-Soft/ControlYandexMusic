let DarkColors = {
    gradient: "linear-gradient(0deg, #121212 0%, #222222 100%)",
    dark: "#222222",
    white: "#EEEEEE",
    grey: "929292",
    red: "#DB0000",
    yellow: "#EDCD00"
}
let darkTitle = document.querySelectorAll(".title");
let darkduration = document.querySelectorAll(".duration");
let darkCurrentTime = document.querySelectorAll(".current-time");
let darkContentMenu = document.querySelectorAll(".content-menu")[0];
let listTrack = document.querySelectorAll(".list-track")[0];
let popup = document.getElementsByClassName("popup-btn")[0];

let elementsText = [darkTitle, darkduration, darkCurrentTime];
let rootCss = document.querySelector(':root');

let setDarkTheme = (isDark = true) => {
    try {
        if (isDark) {
            setDarkText();
            document.body.style.setProperty("--bodyOpacity", 1); // set dark background
            popup.style.backgroundImage = "url(../img/popup-dark.svg)";
            darkTitle[0].style.color = DarkColors.white;
            darkTitle[0].style.background = DarkColors.dark;
            listTrack.style.color = DarkColors.white;
            darkContentMenu.style.background = DarkColors.dark;
            darkContentMenu.style.color = DarkColors.white;
            rootCss.style.setProperty('--mainRed', '#DB0000');
            rootCss.style.setProperty('--slider', '#929292');
            rootCss.style.setProperty('--progress', '#EDCD00');
            rootCss.style.setProperty('--handleWhite', '#EEEEEE');
            rootCss.style.setProperty('--backgroundControl', 'rgba(252, 252, 255, 0.1)');
        } else {
            setDarkText(false);
            document.body.style.setProperty("--bodyOpacity", 0); // set bright background
            popup.style.backgroundImage = "";
            darkTitle[0].style.background = "";
            darkTitle[0].style.color = "";
            listTrack.style.color = "";
            darkContentMenu.style.background = "";
            darkContentMenu.style.color = "";
            rootCss.style.setProperty('--mainRed', '#FF3333');
            rootCss.style.setProperty('--slider', '#c2c2c2');
            rootCss.style.setProperty('--progress', '#ffdd00');
            rootCss.style.setProperty('--handleWhite', '#ffffff');
            rootCss.style.setProperty('--backgroundControl', 'rgba(252, 252, 255, 0.17)');
        }
    } catch (error) {}
}

let setDarkText = (isDark = true, arrayElemetns = elementsText) => {
    let currentColor;
    if (isDark) {
        currentColor = DarkColors.white;
    } else {
        currentColor = "";
    }
    for (let i = 0; i < arrayElemetns.length; i++) {
        for (let j = 0; j < arrayElemetns[i].length; j++) {
            arrayElemetns[i][j].style.color = currentColor;
        }
    }
}

let setIncreaseCover = (isIncrease = false) => {
    if (isIncrease) {
        rootCss.style.setProperty('--pixselsForReduce', '20px');
        rootCss.style.setProperty('--coverBackgroundSize', '35px');
        Options.isReduce = true;
        try { changeState(State.isPlay); } catch (error) { console.log(error); }
    } else {
        rootCss.style.setProperty('--pixselsForReduce', '0px');
        rootCss.style.setProperty('--coverBackgroundSize', '45px');
        Options.isReduce = false;
        try { changeState(State.isPlay); } catch (error) { console.log(error); }
    }
}

let disabledOptions = (list, listCheckBox, turnOn = false) => {
    if (turnOn) {
        for (let i = 0; i < list.length; i++) {
            list[i].style.color = "";
            list[i].style.filter = "";
            list[i].style.background = "";
            list[i].style.borderRadius = "";
        }
        for (let i = 0; i < listCheckBox.length; i++) {
            listCheckBox[i].disabled = false;
        }
        return;
    } else {
        for (let i = 0; i < list.length; i++) { // disabled options
            list[i].style.color = "rgb(194, 194, 194)";
            list[i].style.filter = "grayscale(0.1)";
            list[i].style.background = "gray";
            list[i].style.borderRadius = "5px";

        }
        for (let i = 0; i < listCheckBox.length; i++) {
            listCheckBox[i].disabled = true;
        }
    }
}