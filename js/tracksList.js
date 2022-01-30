let tracksListTitle = document.getElementsByClassName("title-list")[0];
let listTracks = document.getElementsByClassName("list-track")[0];
let requestSourceInfo;
let requestTracksList;
let previousSelectItem;
let selectedItem;
let likeItem;
let isFirstScroll = false;
let t = 1000;
let resistorsOM = [470, 22, 220, 290, 10, 100, 150, 1000, 47, 330, 510, 270, 680];
let resistorsKOM = [10, 47, 470, 300, 68, 51, 20, 2.2, 5.1, 1000, 1000, 2, 100, 680, 220, 6.8, 3.3, 57];
// for (let i = resistorsKOM.length - 1; i >= 0; i--) {
//     resistorsKOM[i] = resistorsKOM[i] * 1000;
// }

resistorsOM.sort(function(a, b) { return a - b });
resistorsKOM.sort(function(a, b) { return a - b });
console.log(resistorsOM);
console.log(resistorsKOM);

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
            openCOV(itmeCover, getUrl(list[i].cover, 400));
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
let getUrl = (url, size = 50) => {
    if (url == undefined) {
        url = "img/icon.png"
        return url;
    } else {
        let endSlice = url.lastIndexOf("/") - url.length + 1;
        url = "https://" + url
        url = url.slice(0, endSlice); // -
        url += size + "x" + size;
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

// function offset(el) {
//     var rect = el.getBoundingClientRect(),
//         scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
//         scrollTop = window.pageYOffset || document.documentElement.scrollTop;
//     return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
// }
let openCOV = (item, urlCover) => {
    function offset(el) {
        var rect = el.getBoundingClientRect(),
            scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
    }

    let openImage = (item) => {
        let width = item.offsetWidth;
        let height = item.offsetHeight;
        let itemOffset = offset(item);
        let modalCoverOffset = offset(modalCover[0]);

        let left = itemOffset.left - 30 - 130 - 25; //modalCover[0].offsetLeft - modalCoverOffset.left - 25;
        let top = itemOffset.top - modalCoverOffset.top - 133 - 10;
        //console.log("width ", width, "height ", height);
        console.log("left ", left, "top ", top);
        console.log("itemOffset Left ", itemOffset.left, "itemOffset top", itemOffset.top);
        console.log("modalCover Left Offset", modalCoverOffset.left, "modalCover top Offset", modalCoverOffset.top);
        let keyframe = {
            width: [width + 'px', 80 + '%'],
            height: [height + 'px', 96 + '%'],
            transform: ['translate(' + left + 'px, ' + top + 'px)', 'translate(0px, 0px)'],
            borderRadius: ['10px', '20px'],
            easing: ['cubic-bezier(.85, .2, 1, 1)']
        };
        console.log(keyframe);
        let options = {
            duration: 700,
            //fill: 'both',
        }
        CurrentAnimation.keyframe = keyframe;
        CurrentAnimation.options = options;
        CurrentAnimation.left = left;
        CurrentAnimation.top = top;
        CurrentAnimation.isFromList = true;
        modalCover[0].animate(keyframe, options);
    }
    let px = 400;

    function testImage(url) {
        try {
            //urlCover = getUrl(urlCover, px) 
            modalCover[0].style.backgroundImage = "url(" + url + ")";
            modalCover[0].onerror = function() {
                if (px > 100) {
                    if (px == 100) {
                        px += -50;
                        testImage(getUrl(url, px))
                    }
                    px += -100;
                    testImage(getUrl(url, px));
                }
            };
            modalCover[0].onload = () => {
                modal[0].style.display = "flex";
                let left = modalCover[0].offsetLeft;
                let top = modalCover[0].offsetTop;
                console.log("modalCover left ", left, "modalCover top ", top);
                openImage(item);

            }
            modalCover[0].src = urlCover;

        } catch (error) {
            console.log(error);
        }
    }
    testImage(urlCover);
}