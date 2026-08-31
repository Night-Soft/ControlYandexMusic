let darkTitle = document.querySelectorAll(".title");
let darkContentMenu = document.querySelectorAll(".content-menu")[0];
let control = document.querySelectorAll(".control");
let listTrack = document.querySelectorAll(".list-track")[0];
let listContent = document.getElementById("listTrack");
let rootCss = document.querySelector(':root');

const backgroundAnim = (function () {
    let curColEl = document.querySelector('.color1');
    let animBackEl = document.querySelector('.color2');
    let prevIndex = -1;

    animBackEl.addEventListener("animationend", () => {
        animBackEl.classList.remove("prev-color", "next-color");
    });

    function toggleColor(isNext) {
        document.body.style.setProperty("--prevGradient", ColorTheme.prevGradient);
        animBackEl.classList.remove(!isNext ? "next-color" : "prev-color");
        animBackEl.classList.add(isNext ? "next-color": "prev-color");
    }

    return {
        setPrevIndex: (index) => { if (prevIndex >= 0) prevIndex = index; },
        toggle: (index, force = false) => {
            if (force) {
                toggleColor(true);
                return;
            }

            if (index === -1) {
                prevIndex = -1;
                return;
            }

            toggleColor(index >= prevIndex);
            prevIndex = index;
        }
    }
})();

let Themes = {
    default: {
        bodyBackground: "linear-gradient(0deg, rgb(255, 85, 85) 0%, rgb(255, 221, 0) 100%)",
        color: "#ffffff",
    },
    light: {
        bodyBackground: "linear-gradient(0deg, rgb(242, 243, 242) 0%, rgb(249, 249, 248) 100%)",
        color: "#202c3d",
        backgroundColor: "#ECECEB",
        selectedItemColor: "#FFA653"
    },
    dark: {
        bodyBackground: "linear-gradient(0deg, rgb(18, 18, 18) 0%, rgb(34, 34, 34) 100%)",
        colors: {
            dark: "#222222",
            white: "#EEEEEE",
            grey: "#929292",
            red: "#DB0000",
            yellow: "#EDCD00"
        }
    },
    Old: {
        color: "light",
        name: "Old",
        gradient: "linear-gradient(0deg, rgb(255, 85, 85) 0%, rgb(255, 221, 0) 100%)",
        index: 0
    }
}

const ColorTheme = {
    index: undefined,
    gradient: undefined,
    prevGradient: undefined,
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

const hexToRgb = (hex) => {
  const cleanHex = hex.replace('#', '');
  
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return [ r, g, b ]; 
};

const getTextColor = (color = []) => {
    let colors = color;
    if(typeof colors === "string") {
        colors = hexToRgb(color);
    }

    const sum = colors.reduce((sum, value) => { return sum += Number(value) }, 0);
    return sum >= 382.5 ? "dark" : "light";
}

const OtherTheme = { color: undefined, name: undefined, gradient: undefined, index: undefined }

const createSelection = function () {
    if (Extension.windowName === 'extension') {
        if(Options.theme.name === "CoverTheme") { // coverTheme
            clearSelection();
            coverThemeEl.classList.toggle("user-theme-selected", true);
            return;
        }

        const { color, name, gradient } = Options.theme;
        Object.assign(OtherTheme, Options.theme);

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
}

const clearSelection = function () {
    for (element of prevThemes.children) {
        element.classList.remove("user-theme-selected");
    }
    if(Options.theme.name !== "CoverTheme") {
        coverThemeEl.classList.remove("user-theme-selected");
    }
}

const getCoverTheme = () => { 
    if (!Player.track) return { name: null };

    const colors = Player.track.derivedColors;
    const rgb1 = hexToRgb(colors.average);
    const rgb2 = hexToRgb(colors.accent);
    const gradient = `linear-gradient(rgb(${rgb2.join()}), rgb(${rgb1.join()}))`;
    const color = getTextColor(colors.average);

    return {
        index: -1,
        name: "CoverTheme",
        color,
        gradient,
    }
}

const setProgressOverlayColor = () => {
    const gradient = ColorTheme.gradient;
    const regex = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/g;
    let [topColor, bottomColor] = [...gradient.matchAll(regex)].filter((value, index, array) => {
        if (index == 0) return true;
        if (index == array.length - 1) return true;
    }).map(value => value.filter(value => isFinite(value)).map(value => Number(value)));
        
    let middleColor = topColor.map((value, index) => (value + bottomColor[index]) / 2);
    topColor = rgbToHsl(topColor);
    bottomColor = rgbToHsl(bottomColor);
    middleColor = rgbToHsl(middleColor);

    const wColor = Extension.windowName === "extension" ? bottomColor : topColor;
    let lightness = 20.78;
    if (middleColor.array[2] >= 50) { // light
        lightness = wColor.array[2] + 35 > 100 ? wColor.array[2] - 35 : wColor.array[2] + 35;
    } else {
        lightness = wColor.array[2] - 35 > 0 ? wColor.array[2] - 35 : wColor.array[2] + 35;
    }
    lightness = parseFloat(lightness.toFixed(2));
    rootCss.style.setProperty("--progress-overlay-color", `hsl(0deg 0% ${lightness}% / 30%)`); // dark
}

const getWindowColorScheme = () => {
    const name = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return name ? "dark" : "light";
}

const light = (theme, windowName) => {
    rootCss.style.setProperty('--slider', '#dcdcdc');
    rootCss.style.setProperty('--handleWhite', '#ffffff');
    rootCss.style.setProperty('--backgroundControl', 'rgba(252, 252, 255, 0.17)');
    rootCss.style.setProperty('--toggleHover', '#ffffff');
    setProgressOverlayColor();

    document.body.style.setProperty("--color", "#000000"); // Themes.light.color

    rootCss.style.setProperty("--listTrackBackground",
        theme === "light" ? "rgba(127 127 127 / 35%)" : "rgba(200 200 200 / 35%)"
    );

    if (windowName === "extension") {
        darkContentMenu.style.background = "";
        darkContentMenu.style.color = "";
        rootCss.style.setProperty("--settingItemBackground", "rgba(255 255 255 / 50%)");
        listTrack.style.background = "rgb(255 255 255 / 50%)";

        rootCss.style.setProperty('--settingItemHover', 'rgba(0,0,0, 0.2)');
        control.forEach((element) => {
            element.style.borderStyle = "unset";
            element.style.filter = "";
        });
        if (theme !== "light") return;
        clearSelection();
        lightTheme.classList.add("user-theme-selected");
    }
}

const dark = (theme, windowName) => {
    rootCss.style.setProperty('--slider', '#929292');
    rootCss.style.setProperty('--handleWhite', '#EEEEEE');
    rootCss.style.setProperty('--backgroundControl', 'rgba(252, 252, 255, 0.1)');
    rootCss.style.setProperty('--toggleHover', 'rgba(32 48 71 / 30%)');
    rootCss.style.setProperty('--settingItemHover', 'rgba(255, 255, 255, 0.2)');
    rootCss.style.setProperty("--listTrackBackground", 'rgba(0 0 0 / 35%)');
    setProgressOverlayColor();

    document.body.style.setProperty("--color", "#ffffff"); // Themes.dark.colors.white

    if (windowName === "extension") {
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
    }
}

const other = (props) => {
    const themeProp = props ? props : Options.theme;

    const { color, name, gradient, index } = themeProp;

    ColorTheme.index = index;
    ColorTheme.name = name;
    ColorTheme.color = color;

    if (ColorTheme.prevGradient === undefined) {
        ColorTheme.prevGradient = gradient;
    } else {
        ColorTheme.prevGradient = ColorTheme.gradient;
    }

    ColorTheme.gradient = gradient;

    createSelection();

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
        light(name, Extension.windowName);
    } else {
        dark(name, Extension.windowName);
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
}

let setTheme = (theme, windowName) => {
    if(!theme || theme === "default") theme = getWindowColorScheme();
    if(!windowName) windowName = Extension.windowName;
    if (theme === "Old" && Options.theme.index !== 0) {
        Object.assign(Options.theme, Themes.Old);
        writeOptions({ theme: Options.theme }, false);
    }

    try {
        switch (theme) {
            case "dark":
                ColorTheme.prevGradient = ColorTheme.gradient;
                ColorTheme.gradient = Themes.dark.bodyBackground;
                dark(theme, windowName);

                document.body.style.setProperty("--bodyGradient", ColorTheme.gradient); 
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
                
                backgroundAnim.toggle(0, true);
                break;

            case "light":
                ColorTheme.prevGradient = ColorTheme.gradient;
                ColorTheme.gradient = Themes.light.bodyBackground;
                light(theme, windowName);

                document.body.style.setProperty("--bodyGradient", ColorTheme.gradient); 
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

                backgroundAnim.toggle(0, true);
                break;

            case "CoverTheme":
                const themeProp = getCoverTheme();
                if (themeProp.name === null) {
                    setTheme(getWindowColorScheme(), Extension.windowName);
                    return;
                }
                other(themeProp);
                backgroundAnim.toggle(0, true);
                break;
            default:
               // if(theme === "Old")

                other();
                backgroundAnim.toggle(0, true);
                break;
        }
        return;
    } catch (error) {console.warn(error)}
}

let disableOptions = (element, turnOn = false) => {
    element.classList.remove("disable-setting-item");
    element.classList.toggle("disable-setting-item", !turnOn);
}