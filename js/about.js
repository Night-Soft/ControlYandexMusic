let payPal = document.getElementsByClassName("paypal")[0];
let donationAlerts = document.getElementsByClassName("donationalerts")[0];
let title = document.getElementsByClassName("title")[0];
let language = navigator.language;

payPal.onclick = () => {
    window.open("https://www.paypal.com/paypalme2/NightSoftware");
}
donationAlerts.onclick = () => {
    window.open("https://www.donationalerts.com/r/nightsoftware");
}
if (language == "ru") {
    title.innerHTML = chrome.i18n.getMessage("title");
}