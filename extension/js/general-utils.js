let LongPressElement = class {
    static instances = [];
    event = {};
    #isLongPress;
    #timeoutId;
    #onClick;
    #onmousedownBound;
    #onmouseupBound;
    #onmouseleaveBound;
    constructor(element, callback, delay = 700) {
        LongPressElement.instances.push(this);
        this.element = element;
        this.event.onlongpress = callback;
        this.delay = delay;
        this.#onmousedownBound = this.#onmousedown.bind(this);
        this.#onmouseupBound = this.#onmouseup.bind(this);
        this.#onmouseleaveBound = this.#onmouseleave.bind(this);

        let onstart, onend;
        Object.defineProperties(this.event, {
            onlongpress: {
                get() { return callback; },
                set(value) {
                    if (typeof value !== "function") {
                        throw new TypeError(`The '${value}' is not a function.`);
                    }
                    callback = value;
                },
                enumerable: true

            },
            onstart: {
                get() { return onstart; },
                set(value) {
                    if (typeof value !== "function") {
                        throw new TypeError(`The '${value}' is not a function.`);
                    }
                    onstart = value;
                },
                enumerable: true

            },
            onend: {
                get() { return onend; },
                set(value) {
                    if (typeof value !== "function") {
                        throw new TypeError(`The '${value}' is not a function.`);
                    }
                    onend = value;
                },
                enumerable: true

            },
        });

        element.addEventListener("mousedown", this.#onmousedownBound);
        element.addEventListener("mouseup", this.#onmouseupBound);
    }

    #onmousedown(event) {
        if (event.button != 0) { return; }
        this.element.addEventListener("mouseleave", this.#onmouseleaveBound);
        clearTimeout(this.#timeoutId);
        this.#timeoutId = setTimeout(() => {
            this.#isLongPress = true;
            if (this.element.onclick != null) {
                this.#onClick = this.element.onclick;
                this.element.onclick = null;
            }
            this.event.onstart?.();
            this.event.onlongpress?.();
        }, this.delay);
    }
    #onmouseup(event) {
        if (event.button != 0) { return; }
        this.element.removeEventListener("mouseleave", this.#onmouseleaveBound);
        this.#endEvent();
    }
    #onmouseleave() {
        this.#endEvent();
    }
    #endEvent() {
        clearTimeout(this.#timeoutId);
        if (this.#isLongPress) {
            this.#isLongPress = false;
            this.event.onend?.();
            if (this.#onClick != null) {
                setTimeout(() => { this.element.onclick = this.#onClick; }, 0);
            }
        }
    }
    remove() {
        this.element.removeEventListener("mousedown", this.#onmousedownBound);
        this.element.removeEventListener("mouseup", this.#onmouseupBound);
        this.element.removeEventListener("mouseleave", this.#onmouseleaveBound);
    }
}

const LivePlaylist = class {
    elements = new Map();
    clear() {
        this.elements.forEach(({ itemTrack }) => {
            itemTrack.remove();
        });
        this.elements.clear();
        this.#minIndex = undefined;
        this.#maxIndex = undefined;
        this.#firstElement = undefined;
        this.#lastElement = undefined;
    }
    #minIndex;
    #maxIndex;
    get minIndex() { return this.#minIndex; }
    get maxIndex() { return this.#maxIndex; }
    #firstElement;
    #lastElement;
    get firstElement() { return this.#firstElement; }
    get lastElement() { return this.#lastElement; }
    updateMinMaxIndex(value) {
        this.#minIndex = Math.min(...Array.from(this.elements.keys()));
        this.#maxIndex = Math.max(...Array.from(this.elements.keys()));
        this.#firstElement = this.elements.get(this.#minIndex);
        this.#lastElement = this.elements.get(this.#maxIndex);
    }
    // The node before which newNode is inserted.
    getReferenceElement(currentIndex) { 
        if (currentIndex < this.#maxIndex) {
            for (let i = currentIndex + 1; i <= this.#maxIndex; i++) {
                if(this.elements.has(i)) return this.elements.get(i).itemTrack;
            }
            const itemTrack = this.elements.get(this.#minIndex)?.itemTrack;
            return itemTrack ? itemTrack : null;
        }

        return null;

    }

    getIndexes = (currentPos, quantity = 10, insertDirection = "center") => { 
        let startIndex, endIndex;
        const size = Player.list.tracks.size;

        if (quantity > size) quantity = size;

        if (insertDirection === "up") {
            startIndex = currentPos - quantity > 0 ? currentPos - quantity : 0;
            endIndex = startIndex === 0 ? quantity : startIndex + quantity;
        } else if (insertDirection === "down"){
            startIndex = currentPos;
            endIndex = currentPos + quantity < size ? currentPos + quantity : size;
        } else if (insertDirection === "center") {
            startIndex = currentPos - quantity / 2 > 0 ? Math.ceil(currentPos - quantity / 2) : 0;
            endIndex = startIndex + quantity > size ? size : startIndex + quantity;    
            if (endIndex - startIndex < quantity) {
                startIndex -= quantity - (endIndex - startIndex);
            }
        }

        const indexesForCreated = [];
        for (let i = startIndex; i < endIndex; i++) {
            if (!this.elements.has(i) && Player.list.tracks.has(i)) {
                indexesForCreated.push(i);
            }
        }
        
        if (indexesForCreated.length === 0) return;
        return indexesForCreated;
    }
}

const Component = class {
    #regex = /\{\{\s*(\w+)\s*\}\}/;
    #innerAttributes = new Map();
    nodes = [];
    constructor(template, array, predicate) {
        if (!Array.isArray(template)) return;

        this.template = template;
        this.#createElements(template, array, predicate);
        this.#innerAttributes.clear();
    }

    #createElements(template, array, predicate) {
        if (Array.isArray(array)) {
            if (typeof predicate === "function") {
                if (predicate.length === 2) {  // predicate function has 'element' parameter
                    array.forEach((value, index, array) => {
                        template.forEach(template => {
                            this.nodes.push(this.#createOnlyTag(template));
                            const element = this.nodes[index];
                            const data = predicate({ value, index, array }, element);
                            if (this.#varValueList.size > 0) {
                                this.#createTag(this.#innerAttributes.get(element), data, element, true);
                            } else {
                                this.#createTag(this.#innerAttributes.get(element), data, element);
                            }
                        });
                    });

                    // array.some((value, index, array) => {
                    //     template.forEach(template => {
                    //         this.nodes.push(this.#createOnlyTag(template));
                    //         const element = this.nodes[index];
                    //         const data = predicate({ value, index, array }, element);
                    //         if (this.#varValueList.size > 0) {
                    //             this.#createTag(this.#innerAttributes.get(element), data, element, true);
                    //         } else {
                    //             this.#createTag(this.#innerAttributes.get(element), data, element);
                    //         }
                    //     });
                    //     return true;
                    // });
                    // array.slice(1).forEach((value, index, array) => {
                    //     index++;
                    //     template.forEach(template => {
                    //         this.nodes.push(this.#createOnlyTag(template));
                    //         const element = this.nodes[index];
                    //         const data = predicate({ value, index, array }, element);
                    //         if (this.#varValueList.size > 0) {
                    //             this.#createTag(this.#innerAttributes.get(element), data, element, true);
                    //         } else {
                    //             this.#createTag(this.#innerAttributes.get(element), data, element);
                    //         }
                    //     });
                    // });
                    return;
                }
                array.forEach((value, index, array) => {
                    template.forEach(template => {
                        const data = predicate({ value, index, array });
                        if (this.#varValueList.size > 0) {
                            console.log(this.#varValueList)
                            this.nodes.push(this.#createTag(template, data, undefined, true));
                        } else {
                            this.nodes.push(this.#createTag(template, data));
                        }
                    });
                });
                return;
            }

            array.forEach(() => {
                template.forEach(template => {
                    this.nodes.push(this.#createTag(template));
                });
            });
            return;
        }

        template.forEach(element => {
            this.nodes.push(this.#createTag(element));
        });
    }

    #createOnlyTag([tag, attr, tagInside, ...otherTag]) {
        let element = document.createElement(tag);
        this.#innerAttributes.set(element, arguments[0]);

        if (Array.isArray(tagInside)) { 
            element.appendChild(this.#createOnlyTag(tagInside));
        } 
        otherTag.forEach(tags => element.appendChild(this.#createOnlyTag(tags)));
        return element;
    }

    #setAttributes(attr, element, predicate, isTagCreated) {
        if (isTagCreated) { // todo
            [...element.children].forEach((element) => {
                this.#createTag(this.#innerAttributes.get(element), predicate, element);
            });
        }
        attr.forEach(([attr, value]) => {
            if (typeof value === 'string') {
                const strKey = value.match(this.#regex)?.[1]?.trim();
                if (strKey) value = predicate[strKey];
            }

            if (element[attr] !== undefined && typeof value === "function") {
                element[attr] = value;
                return;
            }

            if (attr === 'class' && Array.isArray(value)) {
                element.setAttribute(attr, value.join(" "));
                return;
            }
            if (attr === 'style' && typeof value === "object") {
                Object.entries(value).forEach(([property, value]) => {
                    element.style[property] = value;
                });
                return;
            }

            if (attr.startsWith("ev:")) {
                const eventName = attr.split(":")[1];
                if (typeof value === 'function') {
                    element.addEventListener(eventName, value);
                } else if (Array.isArray(value)) {
                    element.addEventListener(eventName, ...value);
                } else {
                    throw new TypeError();
                }
                return;
            }
            element.setAttribute(attr, value);
        });
    }
    #varValueList = new Map();
    #getVarValueFromList(varString, predicate) {
        return predicate?.[this.#varValueList.get(varString)];
    }
    #getVarValue(varString, predicate) {
        if (typeof varString !== 'string') return null;
        const strKey = varString.match(this.#regex)?.[1]?.trim();
        if (strKey) {
            const value = predicate[strKey];
            this.#varValueList.set(varString, strKey);
            return value ? value : String(value);
        }
        return null;
    }
    #getVariables([tag, attr, tagInside, ...otherTag], predicate){
        let varAttr, varTagInside;
        varAttr = this.#getVarValue(attr, predicate);
        if (typeof tagInside === "string") {
            varTagInside = this.#getVarValue(tagInside, predicate);
            if (varTagInside === null) varTagInside = tagInside;
        }
        if (varAttr) attr = varAttr;
        // TODO
    }
    #createTag([tag, attr, tagInside, ...otherTag], predicate, element, isVarList) {
        let isTagCreated = false;
        let varAttr, varTagInside;

        if (isVarList) {
            varAttr = this.#getVarValueFromList(attr, predicate);
            if (typeof tagInside === "string") {
                varTagInside = this.#getVarValueFromList(tagInside, predicate);
                if (varTagInside === null) varTagInside = tagInside;
            }
            if (varAttr) attr = varAttr;
        } else {
            varAttr = this.#getVarValue(attr, predicate);
            if (typeof tagInside === "string") {
                varTagInside = this.#getVarValue(tagInside, predicate);
                if (varTagInside === null) varTagInside = tagInside;
            }
            if (varAttr) attr = varAttr;
        }

        if (predicate && element) { // if element created
            this.#setAttributes(Object.entries(attr), element, predicate, true);
            isTagCreated = true;
        } else {
            element = document.createElement(tag);
            this.#setAttributes(Object.entries(attr), element, predicate, false);
            if (Array.isArray(tagInside)) { // array
                element.appendChild(this.#createTag(tagInside, predicate, undefined, isVarList));
            }
        }

        if (varTagInside) {
            //console.log(varTagInside)
            const innerHtml = attr["a:innerHTML"];
            element[innerHtml ? "innerHTML" : "innerText"] = varTagInside;
        }

        if (isTagCreated === false) {
            otherTag.forEach(tags => element.appendChild(this.#createTag(tags, predicate, undefined, isVarList)));
        }

        return element;
    }

    appendToElement(element, callback) {
        if(typeof callback === "function") {
            this.nodes.forEach((value, index, array) => {
                callback(element, index, array);
                element.appendChild(value);
            });
            return;
        }

        this.nodes.forEach(value => {
            element.appendChild(value);
        });
    }
}

const supported = typeof window == 'undefined' ? true : "onscrollend" in window;
if (!supported) {

    let timeout;
    const scrollEndEvent = new Event("scrollend");
    function scrollCallback() {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
            this.dispatchEvent(scrollEndEvent);
        }, 100);
    }

    const listeners = new Map();
    function addScrollend() {
        if (listeners.has(this)) {
            listeners.set(this, listeners.get(this) + 1);
            return;
        }

        this.addEventListener("scroll", scrollCallback);
        listeners.set(this, 1);
    }

    function removeScrollend() {
        if (!listeners.has(this)) return;

        listeners.set(this, listeners.get(this) - 1);
        if (listeners.get(this) > 0) return; 

        listeners.delete(this);
        this.removeEventListener('scroll', scrollCallback);
    }

    function interceptListeners(proto, method, callback) { 
        const listener = proto[method];
        proto[method] = function () { 
            const args = [...arguments];
            listener.apply(this, args); // add native listener
            if (args[0] !== "scrollend") return;
            callback.apply(this, args); // create scrollend, remove
        }
    }

    interceptListeners(Element.prototype, 'addEventListener', addScrollend);
    interceptListeners(Element.prototype, 'removeEventListener', removeScrollend);
}

const EventEmitter = {
    events: new Map(),

    on(eventName, listener, once = false) {
        if (this.events.has(eventName)) {
            this.events.get(eventName).listeners.push({ listener, once });
            if (this.events.get(eventName).isEmitted) this.emit(eventName);
            return;
        }
        this.events.set(eventName, { isEmitted: false, listeners: [{ listener, once }] });
    },

    emit(eventName) {
        if (this.events.has(eventName)) {
            this.events.get(eventName).isEmitted ||= true;
            this.events.get(eventName).listeners.forEach(({ listener }) => listener());
            const listeners = this.events.get(eventName).listeners.filter(listener => {
                return listener.once !== true;
            });
            this.events.get(eventName).listeners = listeners;
            return;
        }
        this.events.set(eventName, { isEmitted: true, listeners: [] });
    },

    off(eventName, listener) {
        if (typeof listener === "function") {
            const listeners = this.events.get(eventName).listeners.filter(l => l !== listener);
            this.events.get(eventName).listeners = listeners;
            return;
        }
        this.events.delete(eventName);
    },

    getEvent(eventName) { return this.events.get(eventName); }
}

let onMessageAddListener = () => {
    const onDisconnect = () => {
        Extension.isConnection = false;
        port.isConnection = false;
        Player.isPlay = false;
        showNoConnected();
        setTimeout(() => {
            chrome.windows.getAll().then(result => {
                const isWindow = result.some(wind => wind.type === "normal");
                if (isWindow === false) window.close();
            });
        }, 500);
    }

    port.onDisconnect.addListener(onDisconnect);
    port.onMessage.addListener(function (request) {
        if (request.response) {
            if (request.response.isConnect === true) {
                Extension.isConnection = true;
                port.isConnection = true;
                Player.playlist.clear();
                artistsName.innerText = "Artists";
                trackName.innerText = "Track";
            } else {
                onDisconnect();
            }
        }
    });
}

const windowName = function (pathname = window.location.pathname ) {
    if (pathname === '/index.html') return "extension";
    return pathname == '/side-panel.html' ? "side-panel" : "popup";
}
 
/**
 * 
 * @param {string} text - your text
 * @param {number} ms - milliseconds, how long to show the notification
 */
let showNotification = (text, ms, isMouseEvent) => {
    const notification = new NotificationControl();

    if (text != undefined) { notification.params.text = text; }
    if (ms == undefined) {
        ms = text.length * 66 + 1000; // + 1000ms for focus
        if (ms <= 3500) {  
            ms = 3500;
        }
    }
    if (typeof isMouseEvent === "boolean") notification.toggleMouseEvent(isMouseEvent);

    notification.params.toggleMouseEvent = notification.toggleMouseEvent;
    notification.params.button &&= undefined;
    notification.params.onfinish = null;
    notification.params.oncancel = null;

    notification.show(ms);
    return notification.params;
}

const NotificationControl = class {
    static instances = [];
    #notification;
    #timeLeftLine;
    #closeBtn;
    #buttonElement;
    constructor() {
        if (NotificationControl.instances.length) return NotificationControl.instances[0];

        this.#notification = document.getElementsByClassName("notification")[0];
        this.#timeLeftLine = document.getElementsByClassName("notification-time-left")[0];
        this.#closeBtn = document.getElementsByClassName("close-notification")[0];
        this.#buttonElement = document.getElementsByClassName("notification-action")[0];

        this.#notification.onmouseenter = this.#stayShown;
        this.#notification.onmouseleave = () => {
            if (this.isShown) this.#hide(2500);
        }
        this.#closeBtn.onclick = () => {
            this.#timeLeftLine.removeEventListener("transitionend", this.closeNotification);
            this.closeNotification();
        }
        const thisLink = this;
        let btnParams = new Proxy({ button: thisLink.#buttonElement }, {
            get(target, property, receiver) {
                return Reflect.get(target, property, receiver);
            },
            set(target, property, newValue, receiver) {
                let result;
                if(property === "text") {
                    result = Reflect.set(target, property, newValue, receiver);
                    thisLink.#buttonElement.innerHTML = newValue;
                }
                if (property === "onclick") {
                    result = Reflect.set(target, property, newValue, receiver);
                    thisLink.#buttonElement.onclick = newValue;
                }
                return typeof result === "boolean" ? result : false;
            }
        });

        Object.defineProperties(this.params, {
            button: {
                get() { return btnParams },
                set(value) {
                    if (value === null || value === undefined) {
                        btnParams.text = value;
                        btnParams.onclick = value;
                        thisLink.#buttonElement.style.display = "";
                        return;
                    }
                    if (typeof value !== "object") throw new TypeError("Button is not an Object");
                    if (value?.text) btnParams.text = value.text;
                    if (typeof value?.onclick === "function") btnParams.onclick = value.onclick;
                    thisLink.#buttonElement.style.display = "block";
                },
                enumerable: true
            },
            text: {
                get() { return textNotification.innerHTML; },
                set(value) { textNotification.innerHTML = value; },
                enumerable: true
            }            
        });

        NotificationControl.instances.push(this);
    }

    params = {
        close: () => {
            this.#empty(300);
            this.closeNotification();
        },
        text: undefined,
        button: null,
        onfinish: null,
        oncancel: null
    }

    #fill(ms) {
        this.#timeLeftLine.removeEventListener("transitionend", this.closeNotification);
        this.#timeLeftLine.style.backgroundColor = "#ffffff"
        this.#timeLeftLine.style.width = "100%";
        this.#timeLeftLine.style.transitionDuration = `${ms}ms`;
    }

    #empty(ms) {
        this.#timeLeftLine.removeEventListener("transitionend", this.closeNotification);
        this.#timeLeftLine.style.backgroundColor = "#ff3333";
        this.#timeLeftLine.style.width = "0%";
        this.#timeLeftLine.style.transitionDuration = `${ms}ms`;
    }

    #onmouseenter = null;
    #onmouseleave = null;
    toggleMouseEvent = (toggle = false) => { 
        if (toggle == true) {
            this.#notification.onmouseenter = this.#onmouseenter;
            this.#notification.onmouseleave = this.#onmouseleave;
            this.#closeBtn.style.display = "";
            this.#notification.disabled = false;
        } else {
            this.#onmouseenter = this.#notification.onmouseenter;
            this.#onmouseleave = this.#notification.onmouseleave;
            this.#notification.onmouseenter = null;
            this.#notification.onmouseleave = null;
            this.#closeBtn.style.display = "none";
            this.#notification.disabled = true;
        }
    }

    #addCloseListener = () => {
        this.#timeLeftLine.addEventListener("transitionend", this.closeNotification, { once: true });
    }

    isHiding = false;
    isShown = false;
    show(ms) {
        if (this.isShown == false) {
            this.isShown = true;
            requestAnimationFrame(() => {
                this.#timeLeftLine.style.backgroundColor = "#ffffff"
                this.#timeLeftLine.style.width = "100%";
                this.#notification.style.display = "flex";
            });
            let keyframe = {
                transform: ['translateY(-100%)', 'translateY(0%)'],
            }
            let options = {
                duration: 450,
                fill: "both"
            }
            this.#notification.animate(keyframe, options).onfinish = () => {
                this.#empty(ms);
                this.#addCloseListener();
            };
        } else {
            this.#fill(500);
            this.#timeLeftLine.addEventListener("transitionend", () => {
                this.#timeLeftLine.addEventListener("transitionend", () => {
                    this.#empty(ms);
                    this.#addCloseListener();
                }, { once: true });
            }, { once: true });
        }
    }

    #hide = (ms) => {
        if (this.isHiding) { return; }
        this.isHiding = true;
        this.#empty(ms);
        this.#addCloseListener();
    }

    #stayShown = () => {
        this.isHiding = false;
        this.#fill(500);
    }

    closeNotification = () => {
        this.isShown = false;
        this.isHiding = false;
        let keyframe = {
            transform: ['translateY(0%)', 'translateY(-100%)']
        };
        let options = {
            duration: 450,
            fill: "both"
        }
        const onfinish = () => {
            this.#timeLeftLine.style.transitionDuration = "";
            if (typeof this.params.onfinish === "function") {
                this.params.onfinish();
            }
            this.params.button &&= undefined;
            this.params.onfinish = null;
            this.params.oncancel = null;
        }
        this.#notification.animate(keyframe, options).onfinish = onfinish;
    }
}

/**
 * 
 * @param  {...string | null} params null returns all properties.
 *  id, pinned, active, status, title, url, ...
 * @returns {object | boolean}
 */
let getYandexMusicTab = (...params) => {
    return new Promise(function (resolve) {
        chrome.tabs.query({
            windowType: "normal"
        }, function (tabs) {

            tabs = tabs.filter(tab => tab.url.startsWith("https://music.yandex"));
            const lastTab = tabs[tabs.length - 1];

            if(params[0] === null) {
                resolve(lastTab);
                return;
            }

            if (typeof lastTab === "object") {
                if (params.length > 0) {
                    params = params.filter((value) => {
                        if (lastTab[value] !== undefined) return true;
                    }).reduce((obj, key) => {
                        return Object.assign(obj, { [key]: lastTab[key] })
                    }, {});
                    resolve(params);
                    return;
                } else {
                    resolve(lastTab.id);
                    return;
                }
            }
            resolve(false);
        });
    });
}

const getPopupWindowId = async function () {
    let windows = await chrome.windows.getAll({ populate: true, windowTypes: ['popup'] });
    windows = windows.filter((window) => {
        window = window.tabs.filter(tab => {
            return tab.url.includes(chrome.runtime.id + "/popup.html");
        });
        return window.length > 0;
    });
    return Promise.resolve(windows.length > 0 ? windows[0].id : false);
}

let sendEvent = (event, forceObject = false) => {
    if (typeof(event) != "object") event = { data: event };
    if (forceObject) event = { data: event };
    port.postMessage(event);
}

let sendEventBackground = (event, callback) => { // event should be as object.
    chrome.runtime.sendMessage(event, function(response) {
        if (response != undefined) {
            if (response.options) {
                setOptions(response.options); // options.js
            }
            if (callback != undefined) {
                callback(response);
            }
        }
    });
};

let getUrl = (url, size = 50) => {
    if (url == undefined) {
        url = "img/icon.png"
        return url;
    } else {
        let endSlice = url.lastIndexOf("/") - url.length + 1;
        if (!url.startsWith("https://")) {
            url = "https://" + url
        }
        url = url.slice(0, endSlice); // -
        url += size + "x" + size;
        return url;
    }
}

let testImage = (url, size = 400, callback) => {
    try {
        modalCover[0].src = getUrl(url, size);
        modalCover[0].onerror = function () {
            if (size > 100) {
                if (size == 100) {
                    size += -50;
                    testImage(getUrl(url, size), size)
                }
                size += -100;
                testImage(getUrl(url, size), size);
            }
        };
        modalCover[0].onload = () => {
            modal[0].style.display = "flex";
            callback.animate(callback.parameter); // call animation
        }

    } catch (error) {
        console.log(error);
    }
}

const CoverAnimation = {
    keyframe: { easing: ['cubic-bezier(.85, .2, 1, 1)'] },
    options: {
        duration: 500,
        direction: 'normal'
    },
    element: undefined
}

const openCoverAnimate = function(element, reverse = false) {
    function offset(el) {
        let rect = el.getBoundingClientRect(),
            scrollLeft = document.documentElement.scrollLeft,
            scrollTop = document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
    }

    const { options, keyframe } = CoverAnimation;
    CoverAnimation.element = element;
    let width = element.offsetWidth;
    let height = element.offsetHeight;
    let elementOffset = offset(element);
    let left = -(window.innerWidth / 2 - width / 2 - elementOffset.left);
    let top = -(window.innerHeight / 2 - height / 2 - elementOffset.top);

    const borderRadiusStart = getComputedStyle(element).borderRadius;
    const borderRadiusEnd = getComputedStyle(modalCover[0]).borderRadius;

    keyframe.width = [width + 'px', 100 + '%'];
    keyframe.height = [height + 'px', 100 + '%'];
    keyframe.transform = ['translate(' + left + 'px, ' + top + 'px)', 'translate(0px, 0px)'];
    keyframe.borderRadius = [borderRadiusStart, borderRadiusEnd];

    if (reverse) {
        options.direction = 'reverse'
    } else {
        options.direction = 'normal';
    }

    modalCover[0].animate(keyframe, options);
}

let openCover = (item, url) => {
    // to do:
    testImage(url, 400, { animate: openCoverAnimate, parameter: item });
}

let toggleLike = (isLike, toggleInList = true) => {
    like[0].style.backgroundImage = `url(img/${isLike ? "liked" : "not-liked"}.png)`;
    if (toggleInList === false) return;
    Player.likeItem.classList.remove("list-item-liked", "list-item-not-liked", "list-item-disliked");
    Player.likeItem.classList.add(isLike ? "list-item-liked" : "list-item-not-liked");
}

let toggleDislike = (isDisliked, notifyMe = false, toggleInList = true) => {
    selectedItem.style.filter = isDisliked ? "opacity(0.5)" : "";
    dislike.style.backgroundImage = `url(img/dislike${isDisliked ? "d" : ""}.svg)`;
    notifyMe && showNotification(translate(`${isDisliked ? "addedTo" : "removeFrom"}BlackList`));
    if (toggleInList === false) return;
    Player.likeItem.classList.remove("list-item-liked", "list-item-not-liked", "list-item-disliked");
    isDisliked && Player.likeItem.classList.add("list-item-disliked");
}

const createPopup = function () {
    sendEventBackground({ createPopup: true },
        (result) => {
            if (result.exists) {
                const notification = showNotification(result.message, undefined, false);
                const toggleControl  = notification.toggleMouseEvent.bind(null, true);
                notification.onfinish = toggleControl;
                notification.oncancel = toggleControl;
            }
        });
}

let openNewTab = (tabId) => {
    loaderContainer.style.display = "block";
    appDetected.innerHTML = chrome.i18n.getMessage("waitWhilePage");
    appQuestion.style.display = "none";
    yesNoNew.style.display = "none";

    if (typeof tabId === 'number') {
        chrome.tabs.reload(tabId);
        return;
    }

    chrome.tabs.create({
        url: "https://music.yandex.ru/home",
        active: false
    });
}

let showNoConnected = () => {
    getYandexMusicTab().then((tabId) => {
        if (Extension.isConnection == false) {
            if (tabId) {
                appDetected.innerHTML = chrome.i18n.getMessage("appDetected");
                appQuestion.innerHTML = chrome.i18n.getMessage("appQuestion");
                bntNo.style.display = "none";
                loaderContainer.style.display = "none";
                btnNew.style.display = "";
                yesNoNew.style.display = "flex";
                btnYes.innerHTML = chrome.i18n.getMessage("reload");
                noConnect.style.display = "flex";
                appQuestion.style.display = "";
                noConnect.classList.add("puff-in-center");
            } else {
                appDetected.innerHTML = chrome.i18n.getMessage("appNoDetected");
                appQuestion.innerHTML = chrome.i18n.getMessage("appNoQuestion");
                loaderContainer.style.display = "none";
                btnNew.style.display = "none";
                bntNo.style.display = "none";
                btnYes.innerHTML = chrome.i18n.getMessage("yes");
                yesNoNew.style.display = "flex";
                noConnect.style.display = "flex";
                appQuestion.style.display = "";
            }
        }
    });
}

let splitSeconds = (currentSeconds) => {
    const timeUnits = [3600, 60, 0]; // hours, minutes, seconds
    const time = [];
    timeUnits.forEach((value, index) => {
        if (value == 0) {
            time.push(Math.floor(currentSeconds));
            return;
        }
        if (currentSeconds / value >= 1) {
            time.push(Math.floor(currentSeconds / value));
            currentSeconds = currentSeconds - (time[time.length - 1] * value);
        } else {
            time.push(0);
        }
    });
    
    return { hours: time[0], minutes: time[1], seconds: time[2] }
}

/** 
* @param {...number} time - seconds, minutes, hours.
* Time units must be number.
*/
let twoDigits = function (...args) {
    const formatedTime = args.map((value, index) => {
        if (index === 0 && value === 0) return "00";
        return value < 10 ? "0" + value : value;
    });
    if (formatedTime.length == 1) { formatedTime.push("00") }
    if (formatedTime.length == 0) return "00:00";
    return formatedTime.reverse().join(":");
}

let getDurationAsString = (duration = 0) => {
    const {seconds, minutes, hours} = splitSeconds(duration);
    return hours > 0 ? twoDigits(seconds, minutes, hours) : twoDigits(seconds, minutes);
}    

let setMediaData = (trackTitle, trackArtists, iconTrack) => {
    artistsName[0].innerHTML = trackArtists;
    trackName[0].innerHTML = trackTitle;
    artistsName[0].style.fontSize = "";
    trackName[0].style.fontSize = "";
    if (Extension.windowName == "extension") {
        urlCover = getUrl(iconTrack, 200);
        setFontSize();
    } else {
        urlCover = getUrl(iconTrack, 50);
    }
    trackImage[0].style.backgroundImage = "url(" + urlCover + ")";
}

let setPlaybackStateStyle = (isPlaying) => {
    if (isPlaying == false) {
        PauseIcon.style.display = "none";
        PlayIcon.style.display = "block";
        if (Options.isReduce) {
            if (Extension.windowName == "extension") {
                pause.style.backgroundPosition = "16px center";
            } else {
                pause.style.backgroundPosition = "2px center";
            }
            return;
        }
        if (Extension.windowName == "extension") {
            pause.style.backgroundPosition = "20px center";
        } else {
            pause.style.backgroundPosition = "2px center";
        }
    } else {
        PauseIcon.style.display = "block";
        PlayIcon.style.display = "none";
        pause.style.backgroundPosition = "";
        pause.style.backgroundSize = "";
    }
}

/**
 * 
 * @param {string} key The key to your translation
 */
const translate = function (key) { return chrome.i18n.getMessage(key); }

const rewindHolding = function () {
    let intervalId;
    const start = (seconds = 1.5) => {
        clearInterval(intervalId);
        intervalId = setInterval(() => {
            setTime(Player.position + seconds);
        }, 100);
    }
    const stop = () => { clearInterval(intervalId) }
    return { start, stop }
}

HTMLElement.prototype.setStyle = function (style) {
    if (typeof style != 'object') {
        try {
            throw new Error(`The "${style}" is not Object!`);
        } catch (error) {
            console.error(error);
        }
        return;
    }
    let keys = Object.keys(style);
    for (let i = 0; i < keys.length; i++) {
        this.style[keys[i]] = style[keys[i]];
    }
};

Object.defineProperty(HTMLDivElement.prototype, "longpress", {
    get() {
        if (this.LongPress instanceof LongPressElement) {
            return this.LongPress.event;
        }
        return this.LongPress;
    },
    set(value) {
        if (typeof value === "function") {
            if (this.LongPress instanceof LongPressElement) {
                this.LongPress.event.onlongpress = value;
                return;
            }
            this.LongPress = new LongPressElement(this, value);
            return;
        } else if (value === undefined || value == null) {
            if (this.LongPress instanceof LongPressElement) {
                this.LongPress.remove();
            }
            this.LongPress = value;
            return;
        }
        throw new TypeError(`The '${value}' is not a function.`);
    },
    enumerable: true
});