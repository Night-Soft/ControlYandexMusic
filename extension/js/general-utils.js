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

const Playlist = class {
    #minIndex;
    #maxIndex;
    get minIndex() { return this.#minIndex; }
    get maxIndex() { return this.#maxIndex; }

    get isFullList() {
        const { notCreated } = getUnrealizedIndexes(
            Player.possibleTracks.minIndex,
            Player.possibleTracks.maxIndex
        );

        return notCreated.length === 0;
    }

    #isScrollToCenter = false;
    get isScrollToCenter() { return this.#isScrollToCenter }
    set isScrollToCenter(value) {
        if (value === this.#isScrollToCenter) return

        this.#isScrollToCenter = value;
        if (value === false) return;
        this.#isInit && queueMicrotask(this.#scrollToCenter);
    }
    #scrollToCenter = () => {
        this.#isScrollToCenter = false;
        scrollToCenter();
    }

    #isInit = false;
    get isInit() { return this.#isInit; }
    init() {
        if (this.#isInit) return;

        if (Extension.windowName === "extension") {
            updatePlaylistRects.execute({ type: "resize" });
        }

        EventEmitter.on("playlistIsOpen", () => {
            const addScroll = () => {
                listTracks.addEventListener("scroll", listTracksOnScroll);
                listTracks.removeEventListener("scrollend", addScroll);
                window.addEventListener("resize", updatePlaylistRects.start);
                updatePlaylistRects.start({ type: "resize" });
                clearTimeout(timeoutId);
                this.#isInit = true;
            }

            let timeoutId = setTimeout(addScroll, 1500);

            listTracks.addEventListener("scrollend", addScroll);
            if (this.#isScrollToCenter) {
                this.#isScrollToCenter = false;
                scrollToCenter();
            }
        }, true);
    }

    get isOpen() { return listTracksContainer.style.display !== "" }
    open(withAnim) {
        if (withAnim) {
            if (Extension.windowName === "extension") {
                toggleListMenu(true);
            } else {
                togglePlaylist(true);
            }
            return;
        }
        listTracksContainer.style.display = "flex";
    }
    hide(withAnim) {
        if (withAnim) {
            if (Extension.windowName === "extension") {
                toggleListMenu(false);
            } else {
                togglePlaylist(false);
            }
            return;
        }
        listTracksContainer.style.display = "";
    }

    elements = new BindMap(new Map(), this, {
        set(key) { // key === index
            if (Number.isFinite(this.#maxIndex) === false) {
                this.#maxIndex = key;
                this.elements.last = this.elements.get(key);
            }
            if (Number.isFinite(this.#minIndex) === false) {
                this.#minIndex = key;
                this.elements.first = this.elements.get(key);
            }
            this.updateMinMaxIndex(key);
        },
        delete(key) {
            this.elements.get(key)?.item.remove();
            const indexes = Array.from(this.list.keys());
            const splicedIndexes = indexes.toSpliced(indexes.indexOf(key), 1);
            if (splicedIndexes.length === 0) {
                console.warn("delete error");
                return;
            }
            const minIndex = Math.min(...splicedIndexes);
            const maxIndex = Math.max(...splicedIndexes);
            this.updateMinMaxIndex(minIndex);
            this.updateMinMaxIndex(maxIndex);
        }
    }, false);
    #createRectsForPlaylist() {
        const setRects = function () {
            list = listTracks.getClientRects()[0];
            title = tracksListTitle.getClientRects()[0];
            container = listTracksContainer.getClientRects()[0];

            if (container.height < 100) {
                container.height = document.body.offsetHeight - container.top;
                list.height = document.body.offsetHeight - list.top;
            }
        }

        let title, list, container;

        const rects = {
            get title() {
                if (title === undefined) this.update();
                return title;
            },
            get list() {
                if (list === undefined) this.update();
                return list;
            },
            get container() {
                if (container === undefined) this.update();
                return container;
            },
            update() {
                if (!Player.playlist.isOpen) {
                    Player.playlist.open();

                    setRects();

                    Player.playlist.hide();
                    return;
                }
                setRects();
            }
        }

        return rects;
    }
    rects = this.#createRectsForPlaylist();
    // elements (index) that will be created after updating the track list
    waitingElements = new Set();
    clear() {
        this.elements.forEach(({ item }) => {
            item.remove();
        });

        this.elements.clear();

        this.#minIndex = undefined;
        this.#maxIndex = undefined;
        this.elements.first = undefined;
        this.elements.last = undefined;
    }

    updateMinMaxIndex(index) {
        if (index > this.#maxIndex) {
            this.#maxIndex = index;
            this.elements.last = this.elements.get(this.#maxIndex);
        }
        if (index < this.#minIndex) {
            this.#minIndex = index;
            this.elements.first = this.elements.get(this.#minIndex);
        }
    }

    // The node before which newNode is inserted.
    getReferenceElement(currentIndex) {
        if (currentIndex < this.#maxIndex) {
            for (let i = currentIndex + 1; i <= this.#maxIndex; i++) {
                if (this.elements.has(i)) {
                    return this.elements.get(i).item;
                }
            }
            const item = this.elements.get(this.#minIndex)?.item;
            return item ? item : null;
        }
        return null;
    }

    constructor() {
        Object.defineProperties(this.elements, {
            updateRects: {
                value() {
                    if (!playlist.isOpen) {
                        playlist.open();
                        this.forEach(value => value.rect = value.item.getClientRects()[0]);
                        playlist.hide();
                        return;
                    }
                    this.forEach(value => value.rect = value.item.getClientRects()[0]);
                }
            },
            getConsistent: {
                value(fromIndex, toIndex) {
                    fromIndex ??= playlist.minIndex;
                    toIndex ??= playlist.maxIndex;
                    const minIndex = playlist.minIndex;
                    const maxIndex = playlist.maxIndex;

                    if (toIndex > maxIndex) toIndex = maxIndex;
                    if (fromIndex < minIndex) fromIndex = minIndex;

                    const { notCreated, unloaded } = getUnrealizedIndexes(fromIndex, toIndex);

                    return {
                        is: notCreated.length === 0 && unloaded.length === 0,
                        notCreated,
                        unloaded
                    }
                },
                first: { writable: true, configurable: true },
                last: { writable: true, configurable: true }
            }
        });

        Object.defineProperties(this.waitingElements, {
            include: {
                value(...args) {
                    if (Array.isArray(args[0])) args = args[0];
                    args.forEach(v => this.add(v));
                }
            },
            exclude: {
                value(...args) {
                    if (Array.isArray(args[0])) args = args[0];
                    args.forEach(v => this.delete(v));
                }
            },
            create: {
                value() {
                    const indexesForCreated = [];
                    this.forEach(index => {
                        if (
                            !playlist.elements.has(index) &&
                            Player.possibleTracks.list.has(index)
                        ) indexesForCreated.push(index);
                    });

                    addPlaylistElements(indexesForCreated);
                    this.exclude(indexesForCreated);
                }
            }
        });
    }
}

const BindMap = class {
    #createProxyElements = (newMap = new Map(), methods, isBefore) => {
        const set = (target) => {
            return (key, value) => {
                let result;
                if (isBefore) {
                    if (methods.has("set")) methods.get("set")(key, value);
                    result = target.set(key, value);
                } else {
                    result = target.set(key, value);
                    if (methods.has("set")) methods.get("set")(key, value);
                }

                return result;
            }
        }
        const clear = (target) => {
            return () => {
                let result;
                if (isBefore) {
                    if (methods.has("clear")) methods.get("clear")(target);
                    result = target.clear();
                } else {
                    result = target.clear();
                    if (methods.has("clear")) methods.get("clear")(target);
                }

                return target.clear();
            }
        }
        const del = (target) => {
            return (key) => {
                let result;
                if (isBefore) {
                    if (methods.has("delete")) methods.get("delete")(key, target);
                    result = target.delete(key);
                } else {
                    result = target.delete(key);
                    if (methods.has("delete")) methods.get("delete")(key, target);
                }
                return result;
            }
        }

        const methodCache = new Map();
        return new Proxy(newMap, {
            get(target, prop) {
                if (methodCache.has(prop)) return methodCache.get(prop);
                if (prop === "size") return target[prop];
                if (!Map.prototype[prop]) return target[prop];

                switch (prop) {
                    case "set":
                        methodCache.set(prop, set(target));
                        return methodCache.get(prop);
                    case "clear":
                        methodCache.set(prop, clear(target));
                        return methodCache.get(prop);
                    case "delete":
                        methodCache.set(prop, del(target));
                        return methodCache.get(prop);
                }

                const value = Reflect.get(...arguments);
                if (typeof value !== 'function') return value;

                methodCache.set(prop, value.bind(target));
                return methodCache.get(prop);
            }
        });
    }

    constructor(map, target, methods, isBefore = true) {
        const bindedMethods = new Map();
        for (const key of Object.keys(methods)) {
            bindedMethods.set(key, methods[key].bind(target));
        }
        return this.#createProxyElements(map, bindedMethods, isBefore);
    }
}

const Component = class {
    #regex = /\{\{\s*(\w+(?:\.\w+)*)\s*\}\}/;
    #varList = new Map();
    #innerAttributes = new Map();
    nodes = [];

    constructor(template, array, predicate) {
        if (!Array.isArray(template)) return;

        this.template = template;
        this.#createElements(template, array, predicate);
    }

    #addVars(varString) {
        let strKey = varString.match(this.#regex);
        if (strKey) {
            strKey = strKey[1].trim();
            let properties = strKey.split(".");
            if (properties.length > 1) strKey = properties;
            this.#varList.set(varString, strKey);
        }
    }

    #getVarsFromTemplate(template) {
        template.forEach((data, index) => {
            if (Array.isArray(data)) this.#getVarsFromTemplate(data);
            if (typeof data === "string") this.#addVars(data);
            if (typeof data === "object" && index === 1) {
                Object.entries(data).forEach((value) => {
                    if (typeof value[1] === "string") this.#addVars(value[1]);
                });
            }
        });
    }

    #getVarValueFromList(varString, predicate) {
        const strKey = this.#varList.get(varString);
        if (typeof strKey === 'string') {
            const value = predicate[strKey];
            return value ? value : String(value);
        }
        if (Array.isArray(strKey)) {
            const value = strKey.reduce((prev, key, i) => i === 0 ? predicate[key] : prev[key], 0);
            return value ? value : String(value);
        }
        return varString; // todo fix return null
    }

    #createElements(template, array, predicate) {
        if (Array.isArray(array)) {
            if (typeof predicate === "function") {
                if (predicate.length === 2) {  // predicate function has 'element' parameter
                    this.#getVarsFromTemplate(template);
                    array.forEach((value, index, array) => {
                        template.forEach(template => {
                            this.nodes.push(this.#createOnlyTag(template));
                            this.#createTag(
                                this.#innerAttributes.get(this.nodes[index]),
                                predicate({ value, index, array }, this.nodes[index]),
                                this.nodes[index]
                            );
                        });
                    });
                    return;
                }

                this.#getVarsFromTemplate(template);
                array.forEach((value, index, array) => {
                    template.forEach(template => {
                        this.nodes.push(this.#createTag(template, predicate({ value, index, array })));
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

    #setAttributes(attr, element, predicate) {
        let strKey, eventName;
        attr.forEach(value => {
            if (typeof value[1] === 'string' && value[1].startsWith("{{")) {
                strKey = this.#getVarValueFromList(value[1], predicate);
                if (strKey) value[1] = strKey
            }

            if (element[value[0]] !== undefined && typeof value[1] === "function") {
                element[value[0]] = value[1];
                return;
            }

            if (value[0] === 'class' && Array.isArray(value[1])) {
                element.setAttribute(value[0], value[1].join(" "));
                return;
            }

            if (value[0] === 'style' && typeof value[1] === "object") {
                Object.entries(value[1]).forEach((value) => {
                    element.style[value[0]] = value[1];
                });
                return;
            }

            if (value[0].startsWith("$")) {
                if (value[0] === "$innerHTML") {
                    return;
                }
            }

            if (value[0].startsWith("ev:")) {
                eventName = value[0].split(":")[1];
                if (typeof value[1] === 'function') {
                    element.addEventListener(eventName, value[1]);
                } else if (Array.isArray(value[1])) {
                    element.addEventListener(eventName, ...value[1]);
                } else {
                    throw new TypeError();
                }
                return;
            }
            element.setAttribute(value[0], value[1]);
        });
    }

    /* 
    tag[0] = tag
    tag[1] = attrs
    tag[2] = tagInside
    tag[...3.4.5] = otherTag
    */
    #createTag(tag, predicate, element) {
        let attr = tag[1];
        let tagInside = tag[2];
        if (predicate) {
            if (typeof attr === "string") {
                const varAttr = this.#getVarValueFromList(attr, predicate);
                if (varAttr) attr = varAttr;
            }
            if (typeof tagInside === "string") {
                const varTagInside = this.#getVarValueFromList(tagInside, predicate);
                if (varTagInside !== undefined) tagInside = varTagInside;
            }
        }

        if (element && predicate) {
            [...element.children].forEach((element) => {
                this.#createTag(this.#innerAttributes.get(element), predicate, element);
            });
            this.#setAttributes(Object.entries(attr), element, predicate);
        } else {
            element = document.createElement(tag[0]);
            this.#setAttributes(Object.entries(attr), element, predicate);
            if (Array.isArray(tagInside)) {
                element.appendChild(this.#createTag(tagInside, predicate));
            }

            // otherTag
            tag.slice(3).forEach(tags => {
                element.appendChild(this.#createTag(tags, predicate));
            });

        }

        if (typeof tagInside === "string") {
            if (attr.$innerHTML) {
                element.innerHTML = tagInside;
            } else if (attr.$innerText) {
                element.innerText = tagInside;
            } else {
                if ("textContext" in element) {
                    element.textContext = tagInside;
                } else {
                    element.innerText = tagInside;
                }
            }
        }
        return element;
    }

    appendToElement(element, callback) {
        if (typeof callback === "function") {
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

const ToggleAnimation = class {
    openClass = {
        name: undefined,
        params: []
    };
    closeClass = {
        name: undefined,
        params: []
    };
    onendRemove = true;
    isOpen = false;
    onOpenEnd;
    onCloseEnd;

    constructor(element, {
        open,
        close,
        display,
        onOpenEnd,
        onCloseEnd,
        onendRemove
    } = {}) {
        Object.defineProperties(this, {
            onOpenEnd: {
                get() { return onOpenEnd; },
                set(value) {
                    if (typeof value !== "function") {
                        onOpenEnd = undefined;
                        throw new TypeError();
                    }
                    onOpenEnd = value;
                }
            },
            onCloseEnd: {
                get() { return onCloseEnd; },
                set(value) {
                    if (typeof value !== "function") {
                        onCloseEnd = undefined;
                        throw new TypeError();
                    }
                    onCloseEnd = value;
                }
            }
        });
        this.element = element;

        this.#setClass(open, this.openClass);
        this.#setClass(close, this.closeClass);
        this.display = display;
        if (typeof onendRemove == 'boolean') {
            this.onendRemove = onendRemove;
        }

    }
    #setClass(cssClass, currentClass) {
        if (typeof cssClass === "string") {
            currentClass.name = cssClass;
        } else if (typeof cssClass === "object") {
            currentClass.name = cssClass.name;
            currentClass.params = Object.entries(cssClass).filter(value => value[0] !== "name");
        }
    }

    openAnimationend = () => {
        if (this.onendRemove) this.element.classList.remove(this.openClass.name);
        this.onOpenEnd?.();
    }
    closeAnimationend = () => {
        if (this.onendRemove) this.element.classList.remove(this.closeClass.name);
        if (typeof this.display === "object") {
            this.element.style.display = this.display.close;
        }
        this.onCloseEnd?.();
    }

    open = () => {
        this.element.classList.remove(this.closeClass.name);
        this.element.classList.remove(this.openClass.name);

        this.element.offsetHeight; // reflow
        this.element.classList.add(this.openClass.name);
        this.openClass.params.forEach(([key, value]) => this.element.style[key] = value);
        this.closeClass.params.forEach(([key]) => this.element.style[key] = "");

        if (typeof this.display === "object") {
            this.element.style.display = this.display.open;
        }
        this.element.addEventListener("animationend", this.openAnimationend, { once: true });

        this.isOpen = true;
    }
    close = () => {
        this.element.classList.remove(this.closeClass.name);
        this.element.classList.remove(this.openClass.name);

        this.element.offsetHeight; // reflow

        this.closeClass.params.forEach(([key, value]) => this.element.style[key] = value);
        this.openClass.params.forEach(([key]) => this.element.style[key] = "");

        this.element.classList.add(this.closeClass.name);
        this.element.addEventListener("animationend", this.closeAnimationend, { once: true });

        this.isOpen = false;
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
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
        if (request.response?.isConnect === false) {
            onDisconnect();
        }
    });
}

const windowName = function (pathname = window.location.pathname) {
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
    if (typeof isMouseEvent === "boolean") notification.enableMouseEvent(isMouseEvent);

    notification.params.enableMouseEvent = notification.enableMouseEvent;
    notification.params.button &&= undefined;
    notification.params.onfinish = null;
    notification.params.oncancel = null;

    notification.show(ms);
    return notification.params;
}

const NotificationControl = class {
    static instances = [];
    #notification;
    #textNotification;
    #timeLeftLine;
    #closeBtn;
    #buttonElement;
    constructor() {
        if (NotificationControl.instances.length) return NotificationControl.instances[0];

        this.#notification = document.getElementsByClassName("notification")[0];
        this.#textNotification = document.getElementsByClassName("h2-notification")[0];
        this.#timeLeftLine = document.getElementsByClassName("notification-time-left")[0];
        this.#closeBtn = document.getElementsByClassName("close-notification")[0];
        this.#buttonElement = document.getElementsByClassName("notification-action")[0];

        this.#notification.onmouseenter = this.#stayShown;
        this.#notification.onmouseleave = () => { if (this.isShown) this.#hide(2500); }
        this.#closeBtn.onclick = () => {
            this.#timeLeftLine.removeEventListener("transitionend", this.closeNotification);
            this.closeNotification();
        }

        const instance = this;
        Object.defineProperties(this.params, {
            text: {
                get() { return instance.#textNotification.innerText; },
                set(value) { instance.#textNotification.innerText = value; },
                enumerable: true
            },
            isShown: {
                get() { return instance.isShown },
                enumerable: true
            }
        });

        if (this.#buttonElement) {
            let btnParams = new Proxy({ button: instance.#buttonElement }, {
                get(target, property, receiver) {
                    return Reflect.get(target, property, receiver);
                },
                set(target, property, newValue, receiver) {
                    let result;
                    if (property === "text") {
                        result = Reflect.set(target, property, newValue, receiver);
                        instance.#buttonElement.innerText = newValue;
                    }
                    if (property === "onclick") {
                        result = Reflect.set(target, property, newValue, receiver);
                        instance.#buttonElement.onclick = newValue;
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
                            instance.#buttonElement.style.display = "";
                            return;
                        }
                        if (typeof value !== "object") throw new TypeError("Button is not an Object");
                        if (value?.text) btnParams.text = value.text;
                        if (typeof value?.onclick === "function") btnParams.onclick = value.onclick;
                        instance.#buttonElement.style.display = "block";
                    },
                    enumerable: true
                },
            });
        }

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
        oncancel: null,
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
    enableMouseEvent = (enable = false) => {
        if (enable == true) {
            this.#notification.onmouseenter = this.#onmouseenter;
            this.#notification.onmouseleave = this.#onmouseleave;
            this.#closeBtn.style.display = "";
            this.#notification.disabled = false;
            return;
        }
        this.#onmouseenter = this.#notification.onmouseenter;
        this.#onmouseleave = this.#notification.onmouseleave;
        this.#notification.onmouseenter = null;
        this.#notification.onmouseleave = null;
        this.#closeBtn.style.display = "none";
        this.#notification.disabled = true;
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
                if (typeof ms === 'number') {
                    this.#empty(ms);
                }
                this.#addCloseListener();
            };
        } else {
            this.#fill(500);
            this.#timeLeftLine.addEventListener("transitionend", () => {
                this.#timeLeftLine.addEventListener("transitionend", () => {
                    if (typeof ms === 'number') {
                        this.#empty(ms);
                    }
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

const updatePlaylistEmptyNotification = (() => {
    let notification;
    return (index) => {
        if (index === -1) {
            notification = showNotification(translate("playlistEmpty"), 7000);
            return;
        }
        if (notification) {
            if (notification.text === translate("playlistEmpty") &&
                notification.isShown === true) {

                notification.onfinish = () => notification.text = "";
                notification.close();
            }
        }
    }
})();

/**
 * 
 * @param  {...string | null} params null or undefined, returns all properties.
 *  id, pinned, active, status, title, url, ...
 * @returns {object | boolean}
 */
let getYandexMusicTab = (...params) => {
    return new Promise(function (resolve) {
        chrome.tabs.query({
            windowType: "normal"
        }, function (tabs) {
            let host = ["https://music.yandex", "https://next.music.yandex"];

            tabs = tabs.filter((tab) => {
                let tab1 = tab.url.startsWith(host[0]);
                let tab2 = tab.url.startsWith(host[1]);
                return tab1 + tab2 ? true : false;
            });
            const lastTab = tabs[tabs.length - 1];

            if (params[0] === null) {
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
    let windows = (await chrome.windows.getAll({
        populate: true, windowTypes: ['popup']
    })).filter((window) => {
        window = window.tabs.filter(tab => {
            return tab.url.includes(chrome.runtime.id + "/popup.html");
        });
        return window.length > 0;
    });
    return Promise.resolve(windows.length > 0 ? windows[0].id : false);
}

let sendEvent = (event, forceObject = false) => {
    if (typeof (event) != "object") event = { data: event };
    if (forceObject) event = { data: event };
    port.postMessage(event);
}

/**
* Loads track data into the current playlist starting from a specified index.
*
* @param {number|string} fromIndex - The starting point for loading tracks.
*   - If number: The playlist index from which to start loading tracks (0-based)
*   - If string: Direction indicator ("up" or "down") for directional loading
* @param {number} [after] - Optional. The number of tracks to load after the `fromIndex`.
* @param {number} [before] - Optional. The number of tracks to load before the `fromIndex`.
*
* @returns {Promise<true>} A promise that resolves when the data has been loaded.
*/
const populate = (fromIndex, after = 0, before = 0) => {
    if (Player.canUploadTracks === false) return;
    Player.canUploadTracks = false;

    if (typeof fromIndex === "string") {
        sendEvent({ uploadTracksMeta: fromIndex }, true);
        return;
    }
    if (typeof fromIndex === "number") {
        sendEvent({ uploadTracksMeta: [fromIndex, after, before] }, true);
    }
}

const getDataForPopulate = (unloaded = []) => {
    return {
        minIndex: Math.min(...unloaded),
        maxIndex: Math.max(...unloaded),
        quantity: unloaded.length
    }
}

let sendEventBackground = (event, callback) => { // event should be as object.
    chrome.runtime.sendMessage(event, response => {
        if (callback) {
            if (callback.name === "setOptions") {
                callback(response.options);
                return;
            }
            callback(response);
        }
    });
};

const getOptions = function (callback) {
    sendEventBackground({ getOptions: true }, callback);
}

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
                    testImage(url, size - 50, callback);
                    return;
                }
                testImage(url, size - 100, callback);
            }
        };
        modalCover[0].onload = () => {
            typeof callback === "function" && callback();
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

const openCoverAnimate = function (element, reverse = false) {
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

    options.direction = reverse ? "reverse" : "normal";

    modalCover[0].animate(keyframe, options);
}

let openCover = (item, url) => {
    //testImage(url, item, 400);
    testImage(url, 400, () => {
        modal[0].style.display = "flex";
        openCoverAnimate(item);
    });
}

let toggleLike = (isLike, toggleInList = true) => {
    like[0].style.backgroundImage = `url(img/${isLike ? "liked" : "not-liked"}.png)`;
    if (toggleInList === false) return;
    Player.likeItem.classList.remove("list-item-liked", "list-item-not-liked", "list-item-disliked");
    isLike && Player.likeItem.classList.add("list-item-liked"); // : list-item-not-liked
}

const toggleListLikes = (item, isLike, isDislike) => {
    item.classList.remove("list-item-liked", "list-item-not-liked", "list-item-disliked");
    isLike && item.classList.add("list-item-liked");
    if (isDislike) {
        item.classList.add("list-item-disliked");
        item.parentElement.style.filter = "opacity(0.5)";
    } else {
        item.parentElement.style.filter = "";
    }
}

let toggleDislike = (isDisliked, notifyMe = false, toggleInList = true) => {
    selectedItem.style.filter = isDisliked ? "opacity(0.5)" : "";
    dislike.style.backgroundImage = `url(img/dislike${isDisliked ? "d" : ""}.png)`;
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
                const toggleControl = notification.enableMouseEvent.bind(null, true);
                notification.onfinish = toggleControl;
                notification.oncancel = toggleControl;
            }
        });
}

const getCurrentTab = async () => {
    const tabs = await chrome.tabs.query({ active: true, windowType: "normal" });
    const url = `chrome-extension://${chrome.runtime.id}`;

    for (const tab of tabs) {
        if (tab.active && !tab.url.startsWith(url)) return tab.id;
    }
}

const writeOptions = (options, isSetOptionsNow = true) => {
    if (typeof options != "object") { throw new TypeError("The 'options' is not an 'object!'"); }
    sendEventBackground({ writeOptions: true, options });
    if (isSetOptionsNow) setOptions(options);
}

let openNewTab = (btn) => {
    loaderContainer.style.display = "block";
    appDetected.innerText = translate("waitWhilePage");
    appQuestion.style.display = "none";
    yesNoNew.style.display = "none";
    document.querySelector(".open-in-tab").style.display = "none";

    if (btn === "btn-yes") {
        Promise.all([getYandexMusicTab(), getCurrentTab()]).then(([tabIdYm, tabIdCurrent]) => {
            if (typeof tabIdYm === 'number') {
                chrome.tabs.reload(tabIdYm);
                return;
            }

            if (Options.isOpenInCurrentTab) {
                chrome.tabs.update(tabIdCurrent, {
                    active: true,
                    url: "https://music.yandex.ru/home"
                });
                return;
            }

            chrome.tabs.create({
                active: false,
                url: "https://music.yandex.ru/home"
            });
        });
    }

    if (btn === "btn-new") {
        chrome.tabs.create({ url: "https://music.yandex.ru/home", active: false });
    }
}

let showNoConnected = () => {
    getYandexMusicTab().then((tabId) => {
        if (port.isConnection) return;

        if (tabId) {
            appDetected.innerText = translate("appDetected");
            appQuestion.innerText = translate("appQuestion");
            loaderContainer.style.display = "none";
            btnNew.style.display = "";
            yesNoNew.style.display = "flex";
            btnYes.innerText = translate("reload");
            noConnect.style.display = "flex";
            appQuestion.style.display = "";
            noConnect.classList.add("puff-in-center");
            document.querySelector(".open-in-tab").style.display = "none";
        } else {
            appDetected.innerText = translate("appNoDetected");
            appQuestion.innerText = translate("appNoQuestion");
            loaderContainer.style.display = "none";
            btnNew.style.display = "none";
            btnYes.innerText = translate("yes");
            yesNoNew.style.display = "flex";
            noConnect.style.display = "flex";
            appQuestion.style.display = "";
            const labelOpenCurTab = document.getElementById("labelOpenCurTab");
            labelOpenCurTab.textContent = translate("openInCurrentTab");
            document.querySelector(".open-in-tab").style.display = "";
        }
    });
}

let splitSeconds = (currentSeconds) => {
    const timeUnits = [3600, 60, 0]; // hours, minutes, seconds
    const time = [];
    timeUnits.forEach((value) => {
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
    const { seconds, minutes, hours } = splitSeconds(duration);
    return hours > 0 ? twoDigits(seconds, minutes, hours) : twoDigits(seconds, minutes);
}

let setMediaData = (trackTitle, trackArtists, iconTrack) => {
    artistsName[0].innerText = trackArtists;
    trackName[0].innerText = trackTitle;
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
        progress.style.transitionDuration = "250ms";
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
        progress.style.transitionDuration = "";
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
    Object.entries(style).forEach((value) => {
        this.style[value[0]] = value[1];
    });
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