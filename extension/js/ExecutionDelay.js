const ExecutionDelay = class {
    #func;
    #delay = 1000;
    #isThrottling = false;
    #context;
    #args;
    #timeoutId;
    #fulfilled;
    #isTimeout = false;
    constructor(func, {
        delay = 1000,
        context = null,
        startNow = false,
        executeNow = false,
        isThrottling = false
    } = {},
        ...args) {
        const isFunction = this.setFunction(func, ...args);
        this.delay = delay;
        this.setContext(context);
        this.isThrottling = isThrottling;

        if (isFunction) {
            if (executeNow) this.execute();
            if (startNow) this.start();
        }
    }

    get delay() { return this.#delay; }
    set delay(value) {
        if (typeof value !== 'number') { throw new ReferenceError(`The '${value}' is not 'number'`); }
        this.#delay = value;
    }

    get isThrottling() { return this.#isThrottling; }
    set isThrottling(value) {
        if (typeof value !== 'boolean') { throw new ReferenceError(`The '${value}' is not 'boolean'`); }
        this.#isThrottling = value;
    }

    get isStarted() { return this.#isTimeout; }

    setFunction(func, ...args) {
        if (typeof func != 'function') { return false; }
        this.#func = func;
        if (args.length > 0) this.#args = args;
        return true;
    }
    getFunction() { return this.#func; }

    setArgumetns(...args) {
        if (args.length == 0) { return false }
        this.#args = args;
        return {
            start: this.start.bind(this),
            execute: this.execute.bind(this)
        };
    }

    setContext(context) {
        if (typeof context != 'object' && context != null) {
            throw new TypeError(`The context is '${typeof context}', must be 'object or null.`);
        }
        this.#context = context;
        return {
            start: this.start.bind(this),
            execute: this.execute.bind(this)
        };
    }

    async start(func = this.#func, { delay = this.#delay } = {}, ...args) {
        if (typeof func != 'function') { throw new Error('The function is missing.'); }
        if (args.length > 0) { this.#args = args; }
        if (this.#isThrottling == true && this.#isTimeout == true) {
            let argsMessage = "";
            if (args.length > 0) { argsMessage = "Arguments updated." }
            return Promise.resolve({
                isThrottling: true,
                message: `The timer is still active. ${argsMessage}`
            });
        }
        clearTimeout(this.#timeoutId);
        return new Promise((resolve, reject) => {
            // this.#fulfilled - function for set promise state to fulfilled with stop().
            this.#fulfilled = (message) => { resolve({ causeStops: message }); }
            this.#isTimeout = true;
            this.#timeoutId = setTimeout(async () => {
                try {
                    const result = await func.apply(this.#context, this.#args);
                    const info = `Function completed with delay ${delay}.`;
                    this.#isTimeout = false;
                    this.#fulfilled = undefined;
                    result ? resolve({ result, info }) : resolve(info);
                } catch (error) {
                    this.#isTimeout = false;
                    this.#fulfilled = undefined;
                    reject(error);
                }

            }, delay);
        });
    }

    execute(...args) {
        this.stop("Execute now!");
        if (typeof this.#func != 'function') { throw new Error('The function is missing.'); }
        if (args.length > 0) { this.#args = args; }
        const result = this.#func.apply(this.#context, this.#args);
        if (result) return result;
    }

    stop(cause = "Forecd stopp.") {
        clearTimeout(this.#timeoutId);
        this.#isTimeout = false;
        if (typeof this.#fulfilled == 'function') {
            this.#fulfilled(cause);
            this.#fulfilled = undefined;
        }
    }
};