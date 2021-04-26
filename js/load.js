var start = window.performance.now();
let time;
let ms = 10;

let getExtensionLoad = () => {
    setTimeout(function() {
        if (typeof(Extension) != "object") {
            getExtensionLoad();
        } else {
            Extension.onload();
            getOptionsLoad();

        }
    }, ms);
}
let getOptionsLoad = () => {
    setTimeout(function() {
        if (typeof(Options) != "object") {
            getOptionsLoad();
        } else {
            Options.onload();
            getTranslateLoaded();
        }
    }, ms)
}
let getTranslateLoaded = () => {
    setTimeout(function() {
        if (typeof(Translate) != "object") {
            getTranslateLoaded();

        } else {
            Translate.onload();
            Extension.addTransition();
            //var end = window.performance.now();
            time = window.performance.now() - start;
            // title[1].innerHTML = Number.parseFloat(time).toPrecision(5);
        }
    }, ms);
}
getExtensionLoad();