let tracksListTitle = document.getElementsByClassName("title-list")[0];
let listTracks = document.getElementsByClassName("list-track")[0];
let requestSourceInfo;
let requestTracksList;
let previousSelectItem;
let previousSlider;
let selectedItem;
let likeItem;
let isFirstScroll = false;

let State = { // current
    track: undefined,
    index: undefined, // number
    isLike: undefined,
    isPlay: undefined,
    likeItem: undefined,
    coverLink: undefined,
    coverItem: undefined
}
let CurrentAnimation = {
    keyframe: undefined,
    options: undefined,
    left: undefined,
    top: undefined,
    isFromList: undefined
}

let updateTracksList = (trackInfo) => {
    setTitle(trackInfo.sourceInfo);

    // remove null object from array
    for (let i = trackInfo.tracksList.length; i >= 0; i--) {
        if (trackInfo.tracksList[i] == null) {
            trackInfo.tracksList.splice(i, 1);
        }
    }
    setTracksList(trackInfo.tracksList, trackInfo.index);
}

let setTitle = (title) => {
    requestSourceInfo = title;
    if (title.title != undefined) {
        tracksListTitle.innerHTML = title.title;
    } else {
        tracksListTitle.innerHTML = title.type;
    }
}

let setTracksList = (list, index) => {
    try {
        if (index >= 0 && State.index != index) {
            State.index = index;
            let allItem = document.querySelectorAll(".item-track");
            selectItem(allItem[index]);
        }
        if (equals(list, requestTracksList)) { return; }
    } catch (error) {}

    requestTracksList = list;
    if (requestSourceInfo.type == "radio") {
        setTitle(requestSourceInfo);
        let allItem = document.querySelectorAll(".item-track");
        clearList(allItem);
    }
    createListElement(list, index);
}
let createListElement = (list, index) => {
    for (let i = 0; i < list.length; i++) {
        let itemTrack = document.createElement("DIV");
        itemTrack.classList.add("item-track");

        let itemCover = document.createElement("DIV");
        itemCover.classList.add("item-cover");
        itemCover.setAttribute("loading", "lazy");
        itemCover.style.backgroundImage = "url(" + getUrl(list[i].cover) + ")";
        itemCover.onclick = (ev) => {
            State.coverItem = itemCover;
            openCover(itemCover, getUrl(list[i].cover, 400), animateListImage);
        }

        let contentItemName = document.createElement("DIV");
        contentItemName.classList.add("content-item-name");

        let itemNameTrack = document.createElement("DIV");
        itemNameTrack.classList.add("item-name-track");
        itemNameTrack.innerHTML = list[i].title;

        let itemArtists = document.createElement("DIV");
        itemArtists.classList.add("item-artists");
        itemArtists.innerHTML = getArtists(list[i]);

        contentItemName.appendChild(itemNameTrack);
        contentItemName.appendChild(itemArtists);

        itemTrack.appendChild(itemCover);
        itemTrack.appendChild(contentItemName);

        let listLike = document.createElement("DIV");
        if (list[i].liked) {
            listLike.classList.add("list-like");
            contentItemName.style.maxWidth = "200px";
        }
        itemTrack.onmouseenter = (ev) => {
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            if (ev.target == itemTrack) {
                if (!list[i].liked && State.index == i) {
                    State.likeItem = listLike;
                    State.isLike = list[i];
                    listLike.classList.add("list-dislike");
                    listLike.style.animation = "show-like 1s normal";
                    State.endShowLike = (ev) => {
                        listLike.style.animation = null;
                        listLike.removeEventListener("animationend", State.endShowLike);
                    }
                    listLike.removeEventListener("animationend", State.endShowLikeReverse);
                    listLike.addEventListener("animationend", State.endShowLike);
                    contentItemName.style.maxWidth = "200px";

                }
                if (State.index == i) {
                    listLike.onclick = () => {
                        State.likeItem = listLike;
                        State.isLike = list[i];
                        sendEvent("toggleLike");
                    }
                }
            }
        }
        itemTrack.onmouseleave = (ev) => {
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            if (ev.target == itemTrack) {
                if (!list[i].liked && State.index == i) {
                    State.endShowLikeReverse = (ev) => {
                        listLike.classList.remove("list-dislike");
                        listLike.removeEventListener("animationend", State.endShowLikeReverse);
                        listLike.style.animation = null;
                        contentItemName.style.maxWidth = "";
                    }
                    listLike.removeEventListener("animationend", State.endShowLike);
                    listLike.addEventListener("animationend", State.endShowLikeReverse);
                    listLike.style.animation = "show-like 1s reverse";
                }
                listLike.onclick = null;
            }
        }
        itemTrack.onclick = (ev) => {
            if (ev.target == itemTrack || ev.target == contentItemName ||
                ev.target == itemNameTrack || ev.target == itemArtists) {
                let play = {
                    play: `${i}`,
                }
                if (State.index == i) {
                    sendEvent("togglePause");
                } else {
                    sendEvent(play); // send as object
                    stopUpdater();
                    selectItem(itemTrack);
                    State.index = i;
                    if (!requestTracksList[i].liked) {
                        listLike.classList.add("list-dislike");
                        listLike.style.animation = "show-like 1s normal";
                        let endShowLike = (ev) => {
                            listLike.style.animation = null;
                            listLike.removeEventListener("animationend", endShowLike);
                        }
                        listLike.addEventListener("animationend", endShowLike);

                    }
                    contentItemName.style.maxWidth = "200px";
                    listLike.onclick = () => {
                        State.likeFromPlaylist = true;
                        State.likeItem = listLike;
                        State.isLike = list[i];
                        sendEvent("toggleLike");
                    }
                }
            }
        }
        itemTrack.appendChild(listLike);
        if (index != undefined && index == i) {
            selectItem(itemTrack);
        }
        listTracks.appendChild(itemTrack);

    }
}

// call from extension.js
let toggleListLike = (isLike) => {
    if (State.prevLike != isLike) {
        let contentItemName = document.querySelectorAll(".content-item-name")[State.index];
        if (isLike) {
            State.isLike.liked = isLike;
            State.likeItem.classList.remove("list-dislike");
            State.likeItem.classList.add("list-like");
            contentItemName.style.maxWidth = "200px";
        } else {
            State.isLike.liked = isLike;
            State.likeItem.classList.remove("list-like");
            if (State.likeFromPlaylist == true) {
                State.likeItem.classList.add("list-dislike");
                contentItemName.style.maxWidth = "200px";
                State.likeFromPlaylist = false;
            } else {
                contentItemName.style.maxWidth = "";
            }
        }
        State.prevLike = isLike;
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

let getArtists = (list, number = 3) => {
    let getArtistsTitle = (listArtists) => {
        let artists = "";
        for (let i = 0; i < number; i++) {
            if (listArtists[i] == undefined && i != 0) {
                artists = artists.slice(0, -2);
                return artists;
            }
            artists += listArtists[i].title + "," + " ";
        }
        artists = artists.slice(0, -2);
        return artists;
    }
    if (list.artists.length > 0) {
        return getArtistsTitle(list.artists);
    } else {
        // get from posdcast
        if (list.album.hasOwnProperty("title")) {
            return list.album.title;
        }
        return "";
    }
}

let selectItem = (item) => {
    try {
        if (!State.isLike.liked) {
            State.likeItem.classList.remove("list-dislike");
        }
    } catch (error) {}
    if (previousSelectItem != undefined) {
        previousSelectItem.classList.remove("selected-item");
    }
    item.classList.add("selected-item");
    previousSelectItem = item;
    selectedItem = item;
}

let scrollToSelected = () => {
    if (!isFirstScroll) {
        selectedItem.scrollIntoView({ block: "center", behavior: "smooth" });
        isFirstScroll = true;
    }
}

let clearList = (list) => {
    for (let i = 0; i < list.length; i++) {
        list[i].remove();
    }
}

let animateListImage = (item) => {
    function offset(el) {
        let rect = el.getBoundingClientRect(),
            scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
    }

    let width = item.offsetWidth;
    let height = item.offsetHeight;
    let itemOffset = offset(item);
    let left = -(window.innerWidth / 2 - width / 2 - itemOffset.left);
    let top = -(window.innerHeight / 2 - height / 2 - itemOffset.top);

    let keyframe = {
        width: [width + 'px', 80 + '%'],
        height: [height + 'px', 96 + '%'],
        transform: ['translate(' + left + 'px, ' + top + 'px)', 'translate(0px, 0px)'],
        borderRadius: ['10px', '20px'],
        easing: ['cubic-bezier(.85, .2, 1, 1)']
    };
    let options = {
        duration: 500,
    }
    CurrentAnimation.keyframe = keyframe;
    CurrentAnimation.options = options;
    CurrentAnimation.left = left;
    CurrentAnimation.top = top;
    CurrentAnimation.isFromList = true;
    modalCover[0].animate(keyframe, options);
}