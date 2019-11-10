let payPal = document.getElementsByClassName("paypal")[0];
let donationAlerts = document.getElementsByClassName("donationalerts")[0];

payPal.onclick = () => {
    window.open("https://www.paypal.com/paypalme2/NightSoftware");
}
donationAlerts.onclick = () => {
    window.open("https://www.donationalerts.com/r/nightsoftware");
}