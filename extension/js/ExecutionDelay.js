const ExecutionDelay = class {
    #func;
    #delay;
    #isThrottling;
    #context;
    #args;
    #timeoutId;
    #fulfilled;
    #isTimeout = false;
    /**
    * @param {Function} func - The function to be executed with a delay.
    * @param {Object} [options={}] - Options as an object for setting parameters.
    * @param {number} [options.delay=1000] - The delay time in milliseconds (default: 1000ms).
    * @param {Object|null} [options.context=null] - The context in which the function will be executed (default: null).
    * @param {boolean} [options.startNow=false] - Initiates execution immediately upon initialization (default: false).
    * @param {boolean} [options.executeNow=false] - Executes the function immediately upon initialization (default: false).
    * @param {boolean} [options.isThrottling=false] - Sets whether function calls are throttled (default: false).
    * @param  {...any} args - Additional arguments to be passed to the function.
    */
    constructor(func, {
        delay = 1000,
        context = null,
        startNow = false,
        executeNow = false,
        isThrottling = false
    } = {}, ...args) {
        this.delay = delay;
        this.setContext(context);
        this.isThrottling = isThrottling;

        if (typeof func == 'function') {
            this.setFunction(func, ...args);
            if (executeNow) this.execute();
            if (startNow) this.start();
        }
    }

    get delay() { return this.#delay; }
    set delay(value) {
        if (typeof value !== 'number') { throw new TypeError(`The '${value}' is not 'number'`); }
        this.#delay = value;
    }

    get isThrottling() { return this.#isThrottling; }
    set isThrottling(value) {
        if (typeof value !== 'boolean') { throw new TypeError(`The '${value}' is not 'boolean'`); }
        if (value == false) { this.#args = undefined; }
        this.#isThrottling = value;
    }

    get isStarted() { return this.#isTimeout; }

    getFunction() { return { function: this.#func, arguments: this.#args, context: this.#context } }
    setFunction(func, ...args) {
        if (typeof func != 'function') { throw new TypeError(`The '${func}' is not a function.`); }
        this.#func = func;
        if (args.length > 0) this.#args = args;
        return {
            start: this.start.bind(this),
            execute: this.execute.bind(this),
            setContext: this.setContext.bind(this)
        };
    }

    setArgumetns(...args) {
        if (args.length == 0) { return false }
        this.#args = args;
        return {
            start: this.start.bind(this),
            execute: this.execute.bind(this)
        };
    }
    clearArguments() { this.#args = undefined; }

    getContext() { return this.#context; }
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
    /**
     * Initiates function execution after the specified delay.
     * @param {...any} args - Optional arguments to be passed to the function.
     * @returns {Promise<Object>} - A promise indicating the completion or an active timer.
     */
    start(...args) {
        if (typeof this.#func != 'function') { throw new Error('The function is missing.'); }
        if (this.#isThrottling == true) {
            let argsMessage = "";
            if (args.length > 0) {
                this.#args = args;
                argsMessage = "Arguments updated.";
            }
            if (this.#isTimeout == true) {
                return Promise.resolve({
                    isThrottling: true,
                    message: `The timer is still active. ${argsMessage}`
                });
            }
        }
        clearTimeout(this.#timeoutId);
        this.#isTimeout = true;
        return new Promise((resolve, reject) => {
            // this.#fulfilled - function for set promise state to fulfilled with stop().
            this.#fulfilled = (message) => { resolve({ causeStops: message }); }
            this.#timeoutId = setTimeout(async () => {
                try {
                    let result;
                    if (this.#isThrottling) {
                        result = await this.#func.apply(this.#context, this.#args);
                    } else {
                        if (args.length > 0) {
                            result = await this.#func.apply(this.#context, args);
                        } else {
                            result = await this.#func.apply(this.#context, this.#args);
                        }
                    }
                    const info = `Function completed with delay ${this.#delay}.`;
                    this.#isTimeout = false;
                    this.#fulfilled = undefined;
                    resolve({ result, info });
                } catch (error) {
                    this.#isTimeout = false;
                    this.#fulfilled = undefined;
                    reject(error);
                }

            }, this.#delay);
        });
    }
    /**
     * Executes the function immediately without waiting for the delay.
     * @param {...any} args - Optional arguments to be passed to the function.
     * @returns {any} - The result of the executed function.
     */
    execute(...args) {
        this.stop("Execute now!");
        if (typeof this.#func != 'function') { throw new Error('The function is missing.'); }
        if (args.length > 0) {
            return this.#func.apply(this.#context, args);
        }
        return this.#func.apply(this.#context, this.#args);
    }
    /**
     * Stops the execution of the function.
     * @param {string} cause - The cause for stopping the execution.
     */
    stop(cause = "Forecd stopp.") {
        clearTimeout(this.#timeoutId);
        this.#isTimeout = false;
        if (typeof this.#fulfilled == 'function') {
            this.#fulfilled(cause);
            this.#fulfilled = undefined;
        }
    }
};