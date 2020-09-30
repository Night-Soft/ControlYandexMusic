console.time("load time");
var start = window.performance.now();
var time;
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
            // console.timeEnd("load time");
            // var end = window.performance.now();
            // time = end - start;
            // console.log("time " + time);
            // title[1].innerHTML = Number.parseFloat(time).toPrecision(5);
        }
    }, ms);
}
getExtensionLoad();