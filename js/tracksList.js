let tracksListTitle = document.getElementsByClassName("title-list")[0];
let listTracks = document.getElementsByClassName("list-track")[0];
let requestSourceInfo;
let requestTracksList;
let previousSelectItem;
let selectedIem;
let isFirstScroll = false;

let updateTracksList = (trackInfo) => {
    setTitle(trackInfo.sourceInfo);
    setTracksList(trackInfo.tracksList, trackInfo.index);
}

let setTitle = (title) => {
    try {
        if (title.link == requestSourceInfo.link) { return; }
        if (requestSourceInfo.type == "radio") {
            listTracks.innerHTML = "";
            let tracksTitle = document.createElement("DIV");
            tracksTitle.classList.add("title-list");
            tracksTitle.innerHTML = title.title;
            let firsItemTrack = document.getElementsByClassName("item-track")[0];
            listTracks.insertBefore(tracksTitle, firsItemTrack);
            tracksListTitle = document.getElementsByClassName("title-list")[0];
        }
    } catch (error) {}
    requestSourceInfo = title;
    tracksListTitle.innerHTML = title.title;
}
let setTracksList = (list, index) => {
    try {
        if (index) {
            let allItem = document.querySelectorAll(".item-track");
            selectItem(allItem[index]);
        }
        if (equals(list, requestTracksList)) { return; }
    } catch (error) {

    }
    requestTracksList = list;
    if (requestSourceInfo.type == "radio") {
        setTitle(requestSourceInfo);
        let allItem = document.querySelectorAll(".item-track");
        clearList(allItem);
    }
    for (let i = 0; i < list.length; i++) {
        let itemTrack = document.createElement("DIV");
        itemTrack.classList.add("item-track");
        let itmeCover = document.createElement("DIV");
        itmeCover.classList.add("item-cover");
        itmeCover.style.backgroundImage = "url(" + getUrl(list[i].cover) + ")";
        let contentItemName = document.createElement("DIV");
        contentItemName.classList.add("content-item-name");

        let itemNameTrack = document.createElement("DIV");
        itemNameTrack.classList.add("item-name-track");
        itemNameTrack.innerHTML = list[i].title;
        let itemArtists = document.createElement("DIV");
        itemArtists.classList.add("item-artists");
        itemArtists.innerHTML = getArtists(list[i]);

        // append child
        contentItemName.appendChild(itemNameTrack);
        contentItemName.appendChild(itemArtists);

        itemTrack.appendChild(itmeCover);
        itemTrack.appendChild(contentItemName);
        itemTrack.onclick = () => {
            console.log("index " + `${i}`);
            let play = {
                play: `${i}`,
            }
            sendEvent(play);
            selectItem(itemTrack);
        }
        if (index != undefined && index == i) {
            selectItem(itemTrack);
        }
        listTracks.appendChild(itemTrack);

    }

}

let getUrl = (url) => {
    if (url == undefined) {
        url = "img/icon.png"
        return url;
    } else {
        url = "https://" + url
        url = url.slice(0, -2);
        url += "50x50";
        return url;
    }
}

const equals = (a, b) => {
    for (let i = 0; i < a.length; i++) {
        if (a[i].title != b[i].title) {
            return false;
        }
    }
    return true;
};
let getArtists = (list) => {
    let artists = "";
    for (let i = 0; i < 3; i++) {
        if (list.artists[i] == undefined) { return artists; }
        artists += list.artists[i].title + " ";
    }
    return artists;
}
let selectItem = (item) => {
    if (previousSelectItem != undefined) {
        previousSelectItem.classList.remove("selected-item");
    }
    item.classList.add("selected-item");
    previousSelectItem = item;
    selectedIem = item;
}
let scrollToSelected = () => {
    if (!isFirstScroll) {
        selectedIem.scrollIntoView({ block: "center", behavior: "smooth" });
        isFirstScroll = true;
    }
}
let clearList = (list) => {
    for (let i = 0; i < list.length; i++) {
        list[i].remove();
    }
}