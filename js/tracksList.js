let tracksListTitle = document.getElementsByClassName("title-list")[0];
let listTracks = document.getElementsByClassName("list-track")[0];
let requestSourceInfo;
let requestTracksList;
let previousSelectItem;
let selectedItem;
let likeItem;
let isFirstScroll = false;

let State = { // current
    track: undefined,
    index: undefined, // number
    isLike: undefined,
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
    for (let i = 0; i < list.length; i++) {
        let itemTrack = document.createElement("DIV");
        itemTrack.classList.add("item-track");

        let itmeCover = document.createElement("DIV");
        itmeCover.classList.add("item-cover");
        itmeCover.style.backgroundImage = "url(" + getUrl(list[i].cover) + ")";
        itmeCover.onclick = (ev) => {
            State.coverItem = itmeCover;
            openCover(itmeCover, getUrl(list[i].cover, 400), animateListImage);
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

        itemTrack.appendChild(itmeCover);
        itemTrack.appendChild(contentItemName);

        let listLike = document.createElement("DIV");
        if (list[i].liked) {
            listLike.classList.add("list-like");
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
                    let endLikeShow = (ev) => {
                        listLike.style.animation = null;
                        listLike.removeEventListener("animationend", endLikeShow);
                    }
                    listLike.addEventListener("animationend", endLikeShow);
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
                    let endLikeShow = (ev) => {
                        listLike.classList.remove("list-dislike");
                        listLike.removeEventListener("animationend", endLikeShow);
                        listLike.style.animation = null;
                    }

                    listLike.addEventListener("animationend", endLikeShow);
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
                    sendEvent(play);
                    selectItem(itemTrack);
                    State.index = i;
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
let updateTracksListLike = (isLike) => {
    if (isLike) {
        State.isLike.liked = isLike;
        State.likeItem.classList.remove("list-dislike");
        State.likeItem.classList.add("list-like");
    } else {
        State.isLike.liked = isLike;
        State.likeItem.classList.remove("list-like");
        State.likeItem.classList.add("list-dislike");
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
        if (list.artists[i] == undefined && i != 0) {
            artists = artists.slice(0, -2);
            return artists;
        }
        artists += list.artists[i].title + "," + " ";
    }
    artists = artists.slice(0, -2);
    return artists;
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
    let modalCoverOffset = offset(modalCover[0]);
    let left = itemOffset.left - 30 - 130 - 25; //modalCover[0].offsetLeft - modalCoverOffset.left - 25;
    let top = itemOffset.top - modalCoverOffset.top - 133 - 10;
    let keyframe = {
        width: [width + 'px', 80 + '%'],
        height: [height + 'px', 96 + '%'],
        transform: ['translate(' + left + 'px, ' + top + 'px)', 'translate(0px, 0px)'],
        borderRadius: ['10px', '20px'],
        easing: ['cubic-bezier(.85, .2, 1, 1)']
    };
    let options = {
        duration: 700,
    }
    CurrentAnimation.keyframe = keyframe;
    CurrentAnimation.options = options;
    CurrentAnimation.left = left;
    CurrentAnimation.top = top;
    CurrentAnimation.isFromList = true;
    modalCover[0].animate(keyframe, options);
}