document.addEventListener('DOMContentLoaded', function() {
    var pause = document.getElementsByClassName("pause");
    pause[0].addEventListener('click', function() {
        console.log("function Extensions");
        pause[0].innerHTML = "ok";

        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            var activeTab = tabs[0];
            //pause[0].innerHTML = tabs[0].url;
            //let pauseTarget = document.getElementsByClassName("player-controls__btn_pause");
            // chrome.tabs.executeScript (null, 
            //     {code: "document.body.style.backgroundColor = '" + e.target.id + "'"}); 
            //chrome.tabs.executeScript(null, { code: "if(pauseTarget == NULL) let pauseTarget; pauseTarget = document.getElementsByClassName('player-controls__btn_pause'); pauseTarget[0].click();" });
            chrome.tabs.executeScript({ file: 'logic.js' });

            // pauseTarget[0].click();
            //console.log("function Extensions");
            pause[0].innerHTML = "ok must";

        });

    }, false);
}, false);