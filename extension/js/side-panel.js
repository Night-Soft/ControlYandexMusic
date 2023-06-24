let SidePanel = {
    onload() {
        let setProgress =() => {
            setTimeout(()=>{
                sliderPrgress.setPosition(State.progress);
                setVolume(State.volume);
                changeState(State.isPlay)
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