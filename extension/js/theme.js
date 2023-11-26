let darkTitle = document.querySelectorAll(".title");
let darkduration = document.querySelectorAll(".duration");
let darkCurrentTime = document.querySelectorAll(".current-time");
let darkContentMenu = document.querySelectorAll(".content-menu")[0];
let control = document.querySelectorAll(".control");

let listTrack = document.querySelectorAll(".list-track")[0];
let listContent = document.getElementById("listTrack");

let btnPopup = document.getElementsByClassName("popup-btn")[0];

let elementsText = [darkTitle, darkduration, darkCurrentTime];
let rootCss = document.querySelector(':root');

let Themes = {
    default: {
        bodyBackground: "linear-gradient(0deg, #FF5555 0%, #ffdd00 100%)",
        color: "#ffffff",
    },
    light: {
        bodyBackground: "linear-gradient(0deg, #F2F3F2 0%, #F9F9F8 100%)",
        color: "#202c3d",
        backgroundColor: "#ECECEB", // listContent
        selectedItemColor: "#FFA653"
    },
    dark: {
        bodyBackground: "linear-gradient(0deg, #121212 0%, #222222 100%)",
        colors: {
            dark: "#222222",
            white: "#EEEEEE",
            grey: "929292",
            red: "#DB0000",
            yellow: "#EDCD00"
        }
       // color: "#202c3d",

    }
    
}
const Filter = {
    black: "brightness(0%) contrast(100%)",
    white: "invert(0%) sepia(72%) saturate(2%) hue-rotate(123deg) brightness(108%) contrast(100%)"
}
//linear-gradient(0deg, #121212 0%, #222222 100%);
let setTheme = (theme = "default", windowName = "default") => {
    try {
        switch (theme) {
            case "dark":
                document.body.style.setProperty("--color", Themes.dark.colors.white);
                document.body.style.setProperty("--bodyGradient", Themes.dark.bodyBackground); // set default background
                document.body.style.setProperty("--bodyOpacity", 1); // set dark background

                rootCss.style.setProperty('--mainRed', '#DB0000');
                rootCss.style.setProperty('--slider', '#929292');
                rootCss.style.setProperty('--progress', '#EDCD00');
                rootCss.style.setProperty('--handleWhite', '#EEEEEE');
                rootCss.style.setProperty('--backgroundControl', 'rgba(252, 252, 255, 0.1)');
                rootCss.style.setProperty('--toggleHover', 'rgb(32 48 71 / 30%)');
                rootCss.style.setProperty('--toggleActive', '#ffdd00');

               
                rootCss.style.setProperty('--selectedItemColor', "");
                listTrack.style.background = "";

                switch (windowName) {
                    case "default":
                        darkTitle[0].setStyle({
                            color: Themes.dark.colors.white,
                            background: Themes.dark.colors.dark
                        });
                        darkContentMenu.setStyle({
                            background: Themes.dark.colors.dark,
                            color: Themes.dark.colors.white
                        });
                        btnPopup.style.backgroundImage = "url(../img/popup-dark.svg)";
                        control.forEach((element) => {
                            element.style.borderStyle = "";
                            element.style.filter = "";
                        });
                        break;
                    case "popup":
                        listContent.style.backgroundColor = "";
                        break;
                    case "side-panel":
                        btnPopup.style.backgroundImage = "url(../img/popup-dark.svg)";
                        listContent.style.backgroundColor = "";
                        break;
                }
                break;

            case "light":
                rootCss.style.setProperty('--mainRed', '#FF3333');
                rootCss.style.setProperty('--slider', '#EBEBEB');
                rootCss.style.setProperty('--progress', '#ffdd00');
                rootCss.style.setProperty('--handleWhite', '#ffffff');
                rootCss.style.setProperty('--backgroundControl', 'rgba(252, 252, 255, 0.17)');
                rootCss.style.setProperty('--selectedItemColor', Themes.light.selectedItemColor);
                rootCss.style.setProperty('--toggleHover', '#ffffff');
                rootCss.style.setProperty('--toggleActive', '#ffdd00');

                document.body.style.setProperty("--bodyOpacity", 1); // set default background
                document.body.style.setProperty("--bodyGradient", Themes.light.bodyBackground); // set default background
                document.body.style.setProperty("--color", Themes.light.color);

                switch (windowName) {
                    case "default":
                        darkContentMenu.style.background = "";
                        darkContentMenu.style.color = "";
                        listTrack.style.background = "rgb(236 236 235 / 75%)";
                        darkTitle[0].style.background = "";
                        darkTitle[0].style.color = "";
                        btnPopup.style.backgroundImage = "";
                        control.forEach((element) => {
                            element.style.borderStyle = "unset";
                            element.style.filter = "";
                        });
                        break;
                    case "popup":
                        listContent.style.backgroundColor = Themes.light.backgroundColor;
                        break;
                    case "side-panel":
                        btnPopup.style.backgroundImage = "";
                        listContent.style.backgroundColor = Themes.light.backgroundColor;
                        break;
                }
                break;
            default:
                document.body.style.setProperty("--color", Themes.default.color);
                rootCss.style.setProperty('--mainRed', '#FF3333');
                rootCss.style.setProperty('--slider', '#EBEBEB');
                rootCss.style.setProperty('--progress', '#ffdd00');
                rootCss.style.setProperty('--handleWhite', '#ffffff');
                rootCss.style.setProperty('--backgroundControl', 'rgba(252, 252, 255, 0.17)');
                document.body.style.setProperty("--bodyOpacity", 0); // set default background
                rootCss.style.setProperty('--toggleHover', 'rgb(32 48 71 / 30%)');
                rootCss.style.setProperty('--toggleActive', '#ffffff');

                rootCss.style.setProperty('--selectedItemColor', "");
                listTrack.style.background = "";

                switch (windowName) {
                    case "default":
                        darkTitle[0].style.background = "";
                        darkTitle[0].style.color = "";
                        listTrack.style.color = "";
                        darkContentMenu.style.background = "";
                        darkContentMenu.style.color = "";
                        btnPopup.style.backgroundImage = "";
                        control.forEach((element) => {
                            element.style.borderStyle = "";
                            element.style.filter = "unset";

                        });
                        break;
                    case "popup":
                        listContent.style.backgroundColor = "";
                        break;
                    case "side-panel":
                        btnPopup.style.backgroundImage = "";
                        listContent.style.backgroundColor = "";
                        break;
                }
                break;
        }
        return;
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
        try { setPlaybackStateStyle(State.isPlay || false); } catch (error) { console.log(error); }
    } else {
        rootCss.style.setProperty('--pixselsForReduce', '0px');
        rootCss.style.setProperty('--coverBackgroundSize', '45px');
        Options.isReduce = false;
        try { setPlaybackStateStyle(State.isPlay || false); } catch (error) { console.log(error); }
    }
}

let disabledOptions = (list, listCheckBox, turnOn = false) => {
    if (turnOn) {
        for (let i = 0; i < list.length; i++) {
            list[i].setStyle({
                color: "",
                filter: "",
                background: "",
                borderRadius: ""
            });
        }
        for (let i = 0; i < listCheckBox.length; i++) {
            listCheckBox[i].disabled = false;
        }
        return;
    } else {
        for (let i = 0; i < list.length; i++) { // disabled options
            list[i].setStyle({
                color: "rgb(194, 194, 194)",
                filter: "grayscale(0.1)",
                background: "gray",
                borderRadius: "5px"
            });
        }
        for (let i = 0; i < listCheckBox.length; i++) {
            listCheckBox[i].disabled = true;
        }
    }
}

HTMLDivElement.prototype.setStyle = function(style) {
    if (typeof style != 'object') {
        try {
            throw new Error(`The "${style}" is not Object!`);
        } catch (error) {
            console.error(error);
        }
        return;
    }
    let keys = Object.keys(style);
    for (let i = 0; i < keys.length; i++) {
        this.style[keys[i]] = style[keys[i]];
    }
  };