let darkTitle = document.querySelectorAll(".title");
let darkContentMenu = document.querySelectorAll(".content-menu")[0];
let control = document.querySelectorAll(".control");
let listTrack = document.querySelectorAll(".list-track")[0];
let listContent = document.getElementById("listTrack");
let btnPopup = document.getElementsByClassName("popup-btn")[0];
let rootCss = document.querySelector(':root');

let Themes = {
    default: {
        bodyBackground: "linear-gradient(0deg, #FF5555 0%, #ffdd00 100%)",
        color: "#ffffff",
    },
    light: {
        bodyBackground: "linear-gradient(0deg, #F2F3F2 0%, #F9F9F8 100%)",
        color: "#202c3d",
        backgroundColor: "#ECECEB", 
        selectedItemColor: "#FFA653"
    },
    dark: {
        bodyBackground: "linear-gradient(0deg, #121212 0%, #222222 100%)",
        colors: {
            dark: "#222222",
            white: "#EEEEEE",
            grey: "#929292",
            red: "#DB0000",
            yellow: "#EDCD00"
        }
    }
}

const OtherTheme = {
    index: undefined,
    gradient: undefined,
    color: undefined,
    name: undefined
}

const getContrastColor = function (color, shift = 30, saturation = 25, lightness = 25, disableMaxL) {
    let maxS = 100 - saturation;
    let [H, S, L] = color;
    let maxL = 95, minL = 60;

    if (H > 360) H = 360;
    if (H < 0) H = 0;
    if (L < 50) minL = 15;

    S = S + saturation >= maxS ? S - saturation : S + saturation;
    
    if (!disableMaxL) {
        if (maxL - L > L - minL) {
            L = L + lightness > maxL ? L + lightness / 2 : L + lightness;
        } else {
            L = L - lightness < minL ? L - lightness / 2 : L - lightness;
        }
    } else {
        L = L < 50? L + lightness: L - lightness;
    }

    const circle = [0, 60, 120, 180, 240, 300, 360, 420];
    circle.every((hue, index) => {
        if (hue >= H && hue < circle[index + 1]) {
            if (H + 30 > hue && H + shift <= 360) {
                H += shift;
            } else {
                H = H - shift < 0 ? 360 + (H - shift) : H - shift;
            }
            return false;
        }
        return true;
    });

    return `hsl(${H.toFixed(2)}deg ${S.toFixed(2)}% ${L.toFixed(2)}%)`;
}

const rgbToHsl = (color) => {
    const rgb = ["R", "G", "B"];
    const { R, G, B } = Object.fromEntries(color.map((value, index) => [rgb[index], value / 255]));
    const max = Math.max(R, G, B);
    const min = Math.min(R, G, B)
    const delta = max - min;
    const lightness = (max + min) / 2;
    const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    let hue;
    if (max === min) {
        hue = 0;
    } else if (max === R) {
        hue = 60 * ((G - B) / (max - min)) % 360;
    } else if (max === G) {
        hue = 60 * ((B - R) / (max - min)) + 120;
    } else if (max === B) {
        hue = 60 * ((R - G) / (max - min)) + 240;
    }

    if (hue < 0) {
        hue += 360;
    }
    const H = hue > 0 ? parseFloat(hue.toFixed(2)) : 0;
    const S = saturation > 0 ? parseFloat((saturation * 100).toFixed(2)) : 0;
    const L = lightness > 0 ? parseFloat((lightness * 100).toFixed(2)) : 0;
    return {
        array: [H, S, L],
        str: `hsl(${H}deg ${S}% ${L}%)`
    }
}

const getTextColor = (colors = []) => {
    const sum = colors.reduce((sum, value) => { return sum += Number(value) }, 0);
    return sum >= 382.5 ? "dark" : "light";
}

const clearSelection = function () {
    for (element of prevThemes.children) {
        element.classList.remove("user-theme-selected");
    }
}

let setTheme = (theme = "default", windowName = "default") => {
    const light = () => {
        rootCss.style.setProperty('--slider', '#EBEBEB');
        rootCss.style.setProperty('--handleWhite', '#ffffff');
        rootCss.style.setProperty('--backgroundControl', 'rgba(252, 252, 255, 0.17)');
        rootCss.style.setProperty('--toggleHover', '#ffffff');
        rootCss.style.setProperty('--toggleActive', Themes.light.color);

        document.body.style.setProperty("--color", "#000000"); // Themes.light.color

        switch (windowName) {
            case "default":
                darkContentMenu.style.background = "";
                darkContentMenu.style.color = "";
                rootCss.style.setProperty("--settingItemBackground", "rgba(255 255 255 / 50%)");
                listTrack.style.background = "rgb(255 255 255 / 70%)";
                rootCss.style.setProperty("--listTrackBackground", 'rgba(0 0 0 / 40%)');
                rootCss.style.setProperty('--settingItemHover', 'rgba(0,0,0, 0.2)');
                btnPopup.style.backgroundImage = "";
                control.forEach((element) => {
                    element.style.borderStyle = "unset";
                    element.style.filter = "";
                });
                if (theme !== "light") return; 
                clearSelection();
                lightTheme.classList.add("user-theme-selected");
                break;
            case "popup":
                rootCss.style.setProperty("--listTrackBackground", 'rgba(200 200 200 / 25%)');
                break;
            case "side-panel":
                rootCss.style.setProperty("--listTrackBackground", 'rgba(200 200 200 / 25%)');
                btnPopup.style.backgroundImage = "";
                break;
        }
    }

    const dark = () => {
        rootCss.style.setProperty('--slider', '#929292');
        rootCss.style.setProperty('--handleWhite', '#EEEEEE');
        rootCss.style.setProperty('--backgroundControl', 'rgba(252, 252, 255, 0.1)');
        rootCss.style.setProperty('--toggleHover', 'rgba(32 48 71 / 30%)');
        rootCss.style.setProperty('--toggleActive', '#ffffff');
        rootCss.style.setProperty('--settingItemHover', 'rgba(255, 255, 255, 0.2)');

        document.body.style.setProperty("--color", "#ffffff"); // Themes.dark.colors.white

        switch (windowName) {
            case "default":
                rootCss.style.setProperty("--listTrackBackground", 'rgba(0 0 0 / 40%)');
                rootCss.style.setProperty("--settingItemBackground", "rgba(0 0 0 / 50%)");
                listTrack.style.background = "";
                darkContentMenu.setStyle({
                    background: Themes.dark.colors.dark,
                    color: "#ffffff"
                });
                control.forEach((element) => {
                    element.style.borderStyle = "";
                    element.style.filter = "";
                });
                if (theme !== "dark") return; 
                clearSelection();
                darkTheme.classList.add("user-theme-selected");
                break;
            case "popup":
                rootCss.style.setProperty("--listTrackBackground", 'rgba(0 0 0 / 25%)');
                break;
            case "side-panel":
                rootCss.style.setProperty("--listTrackBackground", 'rgba(0 0 0 / 25%)');
                break;
        }
    }

    const other = () => {
        const { color, name, gradient, index } = Options.theme;

        OtherTheme.index = index;
        OtherTheme.name = name;
        OtherTheme.color = color;
        OtherTheme.gradient = gradient;

        if (Extension.windowName == 'extension') {
            otherTheme.style.display = "flex";
            otherTheme.style.background = gradient;
            otherThemeName.innerText = name;

            if (otherTheme.classList.contains("user-theme-selected") == false) {
                otherTheme.classList.add("user-theme-selected");
            }
            if (color == "dark") {
                otherThemeName.style.color = Themes.light.color;
                rootCss.style.setProperty('--sideHoverColor', "#000000");
                rootCss.style.setProperty('--settingsСolor', "#000000");
            } else {
                otherThemeName.style.color = Themes.dark.colors.white;
                rootCss.style.setProperty('--settingsСolor', "#ffffff");
                rootCss.style.setProperty('--sideHoverColor', "#ffffff");
            }

            clearSelection();
            otherTheme.classList.add("user-theme-selected");
        }
        const regex = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/g;
        let [topColor, bottomColor] = [...gradient.matchAll(regex)].filter((value, index, array) => {
            if (index == 0) return true;
            if (index == array.length - 1) return true;
        }).map(value => value.filter(value => isFinite(value)).map(value => Number(value)));

        let middleColor = topColor.map((value, index) => (value + bottomColor[index]) / 2);
        topColor = rgbToHsl(topColor);
        bottomColor = rgbToHsl(bottomColor);
        middleColor = rgbToHsl(middleColor);

        if (middleColor.array[2] >= 50) { // make the colors darker
            light();
        } else {
            dark();
        }

        const middleLight = middleColor.array[2];
        const toggleLight = middleLight + 50 > 100 ? middleLight - 50 : middleLight + 50;
        const sliderShadow = topColor.array[2] > 45 ? "rgb(0 0 0 / 15%)" : "rgb(255 255 255 / 15%)";
        const selected = getContrastColor(middleColor.array, 10, 20, 20);
        rootCss.style.setProperty('--toggleColor', `hsl(0deg, 0%, ${parseFloat(toggleLight.toFixed(2))}%)`);
        rootCss.style.setProperty("--topButtonColor", getContrastColor(topColor.array, 15, 25, 25));
        rootCss.style.setProperty("--mainRed", getContrastColor(topColor.array, 15, 20, 20));
        rootCss.style.setProperty("--selectedItemColor", selected);
        rootCss.style.setProperty("--progress", selected);
        rootCss.style.setProperty("--trackPosition", getContrastColor(middleColor.array, 15, 30, 30, true));

        rootCss.style.setProperty("--topColor", topColor.str);
        rootCss.style.setProperty("--middleColor", middleColor.str);
        rootCss.style.setProperty("--bottomColor", bottomColor.str);
        rootCss.style.setProperty("--slider-shadow", `drop-shadow(0px 0px 2px ${sliderShadow})`);
        document.body.style.setProperty("--bodyGradient", gradient);
        document.body.style.setProperty("--bodyOpacity", 1);
    }

    try {
        switch (theme) {
            case "dark":
                dark();
                rootCss.style.setProperty('--mainRed', '#DB0000');
                rootCss.style.setProperty('--progress', '#EDCD00');
                rootCss.style.setProperty('--selectedItemColor', "");
                rootCss.style.setProperty("--trackPosition", "#ff881a");
                rootCss.style.setProperty('--settingsСolor', "#ffffff"); 
                rootCss.style.setProperty('--sideHoverColor', "#ffffff");
                rootCss.style.setProperty('--toggleColor', 'rgb(204, 204, 204)');
                rootCss.style.setProperty("--slider-shadow", "unset");
                rootCss.style.setProperty("--topButtonColor", "");
                rootCss.style.setProperty("--topColor", '');
                rootCss.style.setProperty("--middleColor", '');
                rootCss.style.setProperty("--bottomColor", '');

                document.body.style.setProperty("--bodyGradient", Themes.dark.bodyBackground); 
                document.body.style.setProperty("--bodyOpacity", 1);  

                break;

            case "light":
                light();
                rootCss.style.setProperty('--mainRed', '#FF3333');
                rootCss.style.setProperty('--progress', '#ffdd00');
                rootCss.style.setProperty('--selectedItemColor', Themes.light.selectedItemColor);
                rootCss.style.setProperty("--trackPosition", "#ff881a");
                rootCss.style.setProperty('--settingsСolor', "#ffffff");
                rootCss.style.setProperty('--sideHoverColor', "#ffffff");
                rootCss.style.setProperty('--toggleColor', 'rgb(100, 100, 100)');
                rootCss.style.setProperty("--slider-shadow", "unset");
                rootCss.style.setProperty("--topButtonColor", "");
                rootCss.style.setProperty("--topColor", '');
                rootCss.style.setProperty("--middleColor", '');
                rootCss.style.setProperty("--bottomColor", '');

                document.body.style.setProperty("--bodyOpacity", 1); 
                document.body.style.setProperty("--bodyGradient", Themes.light.bodyBackground); 
                break;
            case "default":
                rootCss.style.setProperty('--mainRed', '');
                rootCss.style.setProperty('--slider', '');
                rootCss.style.setProperty('--progress', '');
                rootCss.style.setProperty('--handleWhite', '');
                rootCss.style.setProperty('--backgroundControl', '');
                rootCss.style.setProperty('--toggleHover', '');
                rootCss.style.setProperty('--toggleActive', '');
                rootCss.style.setProperty('--toggleActive', '');
                rootCss.style.setProperty('--settingsСolor', "");
                rootCss.style.setProperty('--sideHoverColor', "#ffffff");
                rootCss.style.setProperty('--settingItemHover', '');
                rootCss.style.setProperty('--toggleColor', '');
                rootCss.style.setProperty('--selectedItemColor', "");
                rootCss.style.setProperty("--trackPosition", "");
                rootCss.style.setProperty("--slider-shadow", "unset");
                rootCss.style.setProperty("--topButtonColor", "");

                rootCss.style.setProperty("--topColor", '');
                rootCss.style.setProperty("--middleColor", '');
                rootCss.style.setProperty("--bottomColor", '');
        
                document.body.style.setProperty("--color", '');
                document.body.style.setProperty("--bodyOpacity", 0);
                document.body.style.setProperty("--bodyGradient", '');
                switch (windowName) {
                    case "default":
                        listTrack.style.background = "";
                        rootCss.style.setProperty("--listTrackBackground", 'rgba(0 0 0 / 40%)');
                        rootCss.style.setProperty("--settingItemBackground", "");
                        darkTitle[0].style.background = "";
                        darkTitle[0].style.color = "";
                        darkContentMenu.style.background = "";
                        darkContentMenu.style.color = "";
                        btnPopup.style.backgroundImage = "";
                        control.forEach((element) => {
                            element.style.borderStyle = "";
                            element.style.filter = "unset";

                        });
                        clearSelection();
                        defaultTheme.classList.add("user-theme-selected");
                        break;
                    case "popup":
                        rootCss.style.setProperty("--listTrackBackground", 'rgba(0 0 0 / 25%)');
                        break;
                    case "side-panel":
                        rootCss.style.setProperty("--listTrackBackground", 'rgba(0 0 0 / 25%)');
                        btnPopup.style.backgroundImage = "";
                        break;
                }
                break;
            default:
                other();
                break;
        }
        return;
    } catch (error) {}
}

let disableOptions = (element, turnOn = false) => {
    if (turnOn) {
        element.setStyle({
            filter: "",
            pointerEvents: "",
            background: "",
            borderRadius: ""
        });
    } else {
        element.setStyle({
            filter: "grayscale(1) opacity(0.5)",
            pointerEvents: "none",
            background: "gray",
            borderRadius: "10px"
        });
    }
}
