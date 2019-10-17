var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-150296887-1']);
_gaq.push(['_trackPageview']);

(function() {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
})();
// let previous = document.getElementsByClassName("previous");
// let pause = document.getElementsByClassName("pause");
// let next = document.getElementsByClassName("next");
// let modal = document.getElementsByClassName("modal");
// let modalCover = document.getElementsByClassName("modal-cover");
// let like = document.getElementsByClassName("like");

// pause = () => {
//     console.log(pause.namedItem)
//         //trackButton(pause.namedItem)
// }

function trackButton(e) {
    _gaq.push(['_trackEvent', e.target.id, 'clicked']);
};