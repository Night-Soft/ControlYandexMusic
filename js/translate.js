title[0].innerHTML = chrome.i18n.getMessage("title");
console.log("title.length = " + title.length)
title[1].innerHTML = chrome.i18n.getMessage("title");
aritstName[0].innerHTML = chrome.i18n.getMessage("artistName");
trackName[0].innerHTML = chrome.i18n.getMessage("trackName");
about.innerHTML = chrome.i18n.getMessage("about");
contactMe.innerHTML = chrome.i18n.getMessage("contactMe");
shortCuts.innerHTML = chrome.i18n.getMessage("openShortcuts");
let titleHelp = document.getElementsByClassName("title-help")[0];
titleHelp.innerHTML = chrome.i18n.getMessage("helpMenu");
let writeLettr = document.getElementsByTagName("h4")[0];
let aMail = document.createElement("A");
aMail.href = "mailto:support@night-software.cf";
aMail.innerHTML = "support@night-software.cf";
writeLettr.innerHTML = chrome.i18n.getMessage("writeLetter");
writeLettr.appendChild(aMail);