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