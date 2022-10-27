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

let elementsText = [darkTitle, darkduration, darkCurrentTime];
let rootCss = document.querySelector(':root');

let setDarkTheme = (isDark = true) => {
    if (isDark) {
        setDarkText();
        document.body.style.setProperty("--bodyOpacity", 1); // set dark background
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
        document.body.style.setProperty("--bodyOpacity", 0); // set brigth background
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
        setDarkText(false);
    }
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
        changeState(State.isPlay);
    } else {
        rootCss.style.setProperty('--pixselsForReduce', '0px');
        rootCss.style.setProperty('--coverBackgroundSize', '45px');
        Options.isReduce = false;
        changeState(State.isPlay);
    }
}