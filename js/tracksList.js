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
    index: undefined, // Number
    disliked: undefined,
    isPlay: undefined,
    likeItem: undefined,
    coverLink: undefined,
    coverItem: undefined,
    isAutoScroll: false
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
            let allItem = document.querySelectorAll(".item-track");
            selectItem(allItem[index], index);
        }
        if (equals(list, requestTracksList)) { return; }
    } catch (error) {}
    requestTracksList = list;
    setTitle(requestSourceInfo);
    let allItem = document.querySelectorAll(".item-track");
    clearList(allItem);
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
        } else if (list[i].disliked) {
            setDislikedStyle(itemTrack, true);
            listLike.classList.add("list-disliked");
        }
        itemTrack.onmouseenter = (ev) => {
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            if (ev.target == itemTrack) {
                if (!list[i].liked && !list[i].disliked && State.index == i) {
                    State.likeItem = listLike;
                    State.track = list[i];
                    listLike.classList.add("list-dislike");
                    listLike.style.animation = "show-like 1s normal";
                    State.endShowLike = (ev) => {
                        listLike.style.animation = null;
                        listLike.removeEventListener("animationend", State.endShowLike);
                    }
                    listLike.removeEventListener("animationend", State.endShowLikeReverse);
                    listLike.addEventListener("animationend", State.endShowLike);
                }
                if (State.index == i) {
                    listLikeControl(listLike, list[i], i);
                }
            }
        }
        itemTrack.onmouseleave = (ev) => {
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            if (ev.target == itemTrack) {
                if (!list[i].liked && !list[i].disliked && State.index == i) {
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
                listLike.onLongPress = null;
            }
        }
        itemTrack.onclick = (ev) => {
            if (ev.target == itemTrack || ev.target == contentItemName ||
                ev.target == itemNameTrack || ev.target == itemArtists) {
                if (State.index == i) {
                    sendEvent("togglePause");
                } else {
                    sendEvent({ play: `${i}` }, false, true); // send as object
                    stopUpdater();
                    if (!requestTracksList[i].liked && !list[i].disliked) {
                        listLike.classList.add("list-dislike");
                        listLike.style.animation = "show-like 1s normal";
                        let endShowLike = (ev) => {
                            listLike.style.animation = null;
                            listLike.removeEventListener("animationend", endShowLike);
                        }
                        listLike.addEventListener("animationend", endShowLike);

                    }
                    listLikeControl(listLike, list[i], i);
                }
            }
        }
        itemTrack.appendChild(listLike);
        if (index != undefined && index == i) {
            selectItem(itemTrack, index);
        }
        listTracks.appendChild(itemTrack);
    }
}

document.body.onmouseenter = () => { State.isAutoScroll = false; }
document.body.onmouseleave = () => { State.isAutoScroll = true; }

let listLikeControl = (listLike, list, index) => {
    listLike.onclick = () => {
        if (State.index == index) {
            if (State.disliked) {
                State.likeFromPlaylist = true;
                State.likeItem = listLike;
                State.track = list;
                sendEvent("toggleDislike");
                return;
            }
            State.likeFromPlaylist = true;
            State.likeItem = listLike;
            State.track = list;
            sendEvent("toggleLike");
        }
    }
    listLike.onLongPress = new LongPressButton(listLike, () => {
        if (State.index == index) {
            State.likeFromPlaylist = true;
            State.likeItem = listLike;
            State.track = list;
            sendEvent("toggleDislike");
        }

    });
}

// call from extension.js
let toggleListLike = (isLike) => {
    let contentItemName = document.querySelectorAll(".content-item-name")[State.index];
    if (isLike) {
        State.track.liked = isLike;
        State.likeItem.classList.remove("list-dislike");
        State.likeItem.classList.add("list-like");
        // contentItemName.style.maxWidth = "200px";
        contentItemName.style.maxWidth = contentItemName.innerWidth - 35 + "px";

    } else {
        State.track.liked = isLike;
        State.likeItem.classList.remove("list-like");
        if (State.likeFromPlaylist == true) {
            State.likeItem.classList.add("list-dislike");
            //contentItemName.style.maxWidth = "200px";

            State.likeFromPlaylist = false;
        } else {
            contentItemName.style.maxWidth = "";
        }
    }

}
let setDislikedStyle = (item, isDisliked) => {
    if (isDisliked) {
        item.childNodes[0].style.filter = "opacity(0.5)";
        item.childNodes[1].style.filter = "opacity(0.5)";
    } else {
        item.childNodes[0].style.filter = "";
        item.childNodes[1].style.filter = "";
    }
}
let toggleListDisliked = (isDisliked) => {
    let contentItemName = document.querySelectorAll(".content-item-name")[State.index];
    if (isDisliked) {
        State.track.disliked = isDisliked;
        State.likeItem.classList.remove("list-dislike");
        State.likeItem.classList.remove("list-like");
        State.likeItem.classList.add("list-disliked");
        contentItemName.style.maxWidth = contentItemName.innerWidth - 35 + "px";
        setDislikedStyle(selectedItem, isDisliked);
        contentItemName.style.maxWidth = contentItemName.innerWidth - 35 + "px";
    } else {
        State.track.disliked = isDisliked;
        State.likeItem.classList.remove("list-like");
        State.likeItem.classList.remove("list-disliked");
        setDislikedStyle(selectedItem, isDisliked);
        if (State.likeFromPlaylist == true) {
            State.likeItem.classList.add("list-dislike");
            State.likeFromPlaylist = false;
        } else {
            contentItemName.style.maxWidth = "";
        }
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

let getArtists = (list, amount = 3) => {
    let getArtistsTitle = (listArtists) => {
        let artists = "";
        for (let i = 0; i < amount; i++) {
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

let selectItem = (item, index) => {
    try {
        if (!State.track.liked) {
            State.likeItem.classList.remove("list-dislike");
        }
    } catch (error) {}
    if (previousSelectItem != undefined) {
        previousSelectItem.classList.remove("selected-item");
    }
    item.classList.add("selected-item");
    previousSelectItem = item;
    selectedItem = item;
    State.index = index;
    if (State.isAutoScroll) {
        selectedItem.scrollIntoView({ block: "center", behavior: "smooth" });
    }
}

let scrollToSelected = () => {
    if (!isFirstScroll) {
        if (requestTracksList != undefined) {
            selectedItem.scrollIntoView({ block: "center", behavior: "smooth" });
        }
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
    let keyframe;
    if (typeof(fromPopup) != 'undefined') {
        let sizeCover, borderRadius;
        let style = getComputedStyle(item);
        borderRadius = parseInt(style.borderRadius.slice(0, -2));
        if (window.innerHeight > window.innerWidth) {
            sizeCover = window.innerWidth - Math.ceil(15 * window.innerWidth / 100);
            modalCover[0].style.width = sizeCover + "px";
            modalCover[0].style.height = sizeCover + "px";
        } else {
            sizeCover = window.innerHeight - Math.ceil(15 * window.innerHeight / 100);
            modalCover[0].style.width = sizeCover + "px";
            modalCover[0].style.height = sizeCover + "px";
        }
        keyframe = {
            width: [width + 'px', sizeCover + 'px'],
            height: [height + 'px', sizeCover + 'px'],
            transform: ['translate(' + left + 'px, ' + top + 'px)', 'translate(0px, 0px)'],
            borderRadius: [borderRadius + 'px', '20px'],
            easing: ['cubic-bezier(.85, .2, 1, 1)']
        }
    } else {
        keyframe = {
            width: [width + 'px', 80 + '%'],
            height: [height + 'px', 96 + '%'],
            transform: ['translate(' + left + 'px, ' + top + 'px)', 'translate(0px, 0px)'],
            borderRadius: ['10px', '20px'],
            easing: ['cubic-bezier(.85, .2, 1, 1)']
        };
    }

    let options = {
        duration: 500,
    }
    CurrentAnimation.keyframe = keyframe;
    CurrentAnimation.options = options;
    CurrentAnimation.left = left;
    CurrentAnimation.top = top;
    CurrentAnimation.isFromList = true;
    item.style.dispaly = "none";
    modalCover[0].animate(keyframe, options);
}