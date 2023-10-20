const ExecutionDelay = class {
    #func;
    #context;
    #args;
    #timeoutId;
    #isTimeout;
    #fulfilled;
    constructor({
        func,
        context = null,
        delay = 1000,
        executeNow = false,
        startNow = false,
        isThrottling = false
    } = {},
        ...args) {
        const isFunction = this.setFunction(func, ...args);
        this.#context = this.setContext(context);
        if (typeof delay === 'number') {
            this.delay = delay;
        } else {
            throw new ReferenceError(`The '${delay}' is not 'number'`);
        }
        this.isThrottling = isThrottling;

        if (isFunction) {
            if (executeNow) this.execute();
            if (startNow) this.start();
        }
    }

    setFunction(func, ...args) {
        if (typeof func != 'function') { return false; }
        this.#func = func;
        this.setArgumetns(...args);
        return true;
    }

    setArgumetns(...args) {
        if (args.length == 0) { return false }
        this.#args = args;
        return true;
    }

    setContext(context) {
        if (typeof context != 'object' && context != null) {
            throw new TypeError(`The context is '${typeof context}', must be 'object or null.`);
        } 
        this.#context = context;
    }

    async start({ func = this.#func, delay = this.delay } = {}, ...args) {
        if (typeof func != 'function') { throw new Error('The function is missing.'); }
        if (args.length > 0) { this.#args = args; }
        if (this.isThrottling == true && this.#isTimeout == true) {
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
            this.#fulfilled = function (message) { resolve(message); }
            this.#isTimeout = true;
            this.#timeoutId = setTimeout(async () => {
                try {
                    const result = await func.apply(this.#context, this.#args);
                    const message = `Function completed with delay ${delay}.`;
                    this.#isTimeout = false;
                    this.#fulfilled = undefined;
                    result ? resolve({ result, message }) : resolve(message);
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
        this.#func.apply(this.#context, this.#args);
        console.log('Execute now!');
    }

    stop(cause = "run() stopped.") {
        console.log(cause);
        clearTimeout(this.#timeoutId);
        this.#isTimeout = false;
        if (typeof this.#fulfilled == 'function') {
            this.#fulfilled(cause);
            this.#fulfilled = undefined;
        }
    }
};