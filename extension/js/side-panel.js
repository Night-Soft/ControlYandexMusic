let SidePanel = {
    onload() {
        let setProgress =() => {
            setTimeout(()=>{
                sliderPrgress.setPosition({scale: 50});
                setVolume(0.5);
                changeState(getIsPlay())
           // console.log("time out");
            },100);
        }
        togglePlaylist(true);
        JsOnload.addOnload("Slider", setProgress);
    }
}

const popupBtn = document.getElementsByClassName("popup-btn")[0];
popupBtn.onclick = () => {
    sendEventBackground({ createPopup: true},
        (result) => {
            if (result.exists && result.isCreated) {
                showNotification(result.message, 5500);
            } else if (result.exists) {
                showNotification(result.message, 5500);
            }
        });
}

sendEventBackground({sidePanel: true});
SidePanel.onload();