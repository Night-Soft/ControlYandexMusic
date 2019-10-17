//You can also use dispatchEvent
//window.postMessage({ type: "FROM_PAGE", text: "Hello from the webpage!" }, '*');
// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//         console.log(sender.tab ?
//             "from a content script:" + sender.tab.url :
//             "from the extension");
//         if (request.pause == "pause") {
//             console.log("page script");
//             let pauseTarget = document.getElementsByClassName("player-controls__btn_pause");
//             pauseTarget[0].click();
//         }
//     });
// window.addEventListener("message", receiveMessage, false);

// function receiveMessage(event) {
//     console.log("any any");
//     let pauseTarget = document.getElementsByClassName("player-controls__btn_pause");
//     pauseTarget[0].click();
//     if (event.origin !== "http://example.org:8080")
//         console.log("any any");
//     return;
//     console.log("any any");

//     // ...
// }
// let lamp = document.getElementsByClassName("lamp-img");
// lamp[0].addEventListener("click",
//     function() {
//         window.postMessage({ type: "FROM_PAGE", text: "Hello from the webpage!" }, "*");
//     }, false);
//var port = chrome.runtime.connect();



function setAny() {
    let textt = document.getElementsByClassName("text-algin");
    textt[0].style.display = "none";
}
let textter = document.getElementsByClassName("lamp-img");
console.log("textter = " + textter.length)
window.addEventListener("message", function(event) {
    // We only accept messages from ourselves

    if (event.source != window)
        return;

    if (event.data.type && (event.data.type == "FROM_PAGE")) {
        console.log("Content script received ttt: " + event.data.text);
        setAny();
        //port.postMessage(event.data.text);

    }
}, true);