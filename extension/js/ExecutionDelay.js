const ExecutionDelay = class {
    #callback;
    #delay;
    #isThrottle;
    #context;
    #timeoutId;
    #promise;
    #resolve;
    #reject;
    #fulfilled;
    #isTimeout = false;

    /**
    * @param {function} callback - The function to be executed with a delay.
    * @param {Object} [options={}] - Options as an object for setting parameters.
    * @param {number} [options.delay=1000] - The delay time in milliseconds (default: 1000ms).
    * @param {Object | null} [options.context=null] - The context in which the function will be executed (default: null).
    * @param {boolean} [options.startNow=false] - Initiates execution immediately upon initialization (default: false).
    * @param {boolean} [options.executeNow=false] - Executes the function immediately upon initialization (default: false).
    * @param {boolean} [options.isThrottle=false] - Sets whether function calls are throttled (default: false).
    * @param  {...any} args - Additional arguments to be passed to the function.
    */
    constructor(callback, {
        delay = 1000,
        context = null,
        startNow = false,
        executeNow = false,
        isThrottle = false,
        leading = false
    } = {}, ...args) {
        this.delay = delay;
        this.setContext(context);
        this.isThrottle = isThrottle;
        this.leading = leading;

        if (typeof callback == 'function') {
            this.setFunction(callback, ...args);
            if (executeNow) this.execute();
            if (startNow) this.start();
        }
    }

    #arguments = [];
    get #args() { return this.#arguments.length > 0 ? this.#arguments : this.#savedArgs; };
    set #args(value) { this.#arguments = value; };

    #savedArgs = [];
    saveArguments = (...args) => {
        this.#savedArgs = args;
        return { start: this.start, execute: this.execute };
    }

    nextStart = async (...args) => {
        if (this.#promise) {
            return new Promise(async (resolve, reject) => {
                this.#promise
                    .then(() => resolve(this.start(...args)))
                    .catch(reject);
            });
        }

        return this.start(...args);
    }

    get delay() { return this.#delay; }
    set delay(value) {
        if (typeof value !== 'number') { throw new TypeError(`The '${value}' is not 'number'`); }
        this.#delay = value;
    }

    get isThrottle() { return this.#isThrottle; }
    set isThrottle(value) {
        if (typeof value !== 'boolean') { throw new TypeError(`The '${value}' is not 'boolean'`); }
        if (value == false) { this.#args = undefined; }
        this.#isThrottle = value;
    }

    get isStarted() { return this.#isTimeout; }

    getFunction = () => {
        return {
            function: this.#callback,
            arguments: this.#arguments,
            context: this.#context,
            savedArgs: this.#savedArgs
        }
    }

    setFunction = (callback, ...args) => {
        if (typeof callback != 'function') { throw new TypeError(`The '${callback}' is not a function.`); }
        this.#callback = callback;
        this.#savedArgs = args;

        return { start: this.start, execute: this.execute, setContext: this.setContext }
    }

    clearArguments = () => { this.#savedArgs = []; }

    getContext = () => { return this.#context; }
    setContext = (context) => {
        if (typeof context != 'object' && context != null) {
            throw new TypeError(`The context is '${typeof context}', must be 'object or null.`);
        }

        this.#context = context;

        return { start: this.start, execute: this.execute }
    }

    #apply = (args = this.#args) => {
        let isError = false;
        let result;
        try {
            result = this.#callback.apply(this.#context, args);
        } catch (error) {
            isError = true;
            result = error;
        }

        isError ? this.#reject?.(result) : this.#resolve?.(result);
        return result;
    }

    #timeout = () => {
        this.#isTimeout = false;

        if (typeof this.#resolve !== 'function') return;

        this.#apply();

        this.#resolve = null;
        this.#reject = null;
        this.#fulfilled = null;
        this.#promise = null;

        if (this.#isThrottle) this.#createTimeout();
    }

    #createTimeout = () => {
        clearTimeout(this.#timeoutId);
        this.#isTimeout = true;

        this.#timeoutId = setTimeout(this.#timeout, this.#delay);
    }

    #createPromise = (needTimeout = false) => {
        this.#promise = new Promise((resolve, reject) => {
            // this.#fulfilled - function for set promise state to fulfilled with stop().
            this.#fulfilled = (message) => { resolve({ causeStops: message }); }
            this.#resolve = resolve;
            this.#reject = reject;
            if (needTimeout) this.#createTimeout();
        });

        return this.#promise;
    }
    /**
     * Initiates function execution after the specified delay.
     * @param {...any} args - Optional arguments to be passed to the function.
     * @returns {Promise<Object>} - A promise indicating the completion or an active timer.
     */
    start = (...args) => {
        if (typeof this.#callback != 'function') { throw new Error('The function is missing.'); }
        this.#args = args;

        if (this.#isThrottle === true) {
            if (this.#isTimeout && this.#promise) return this.#promise;
            if (!this.#isTimeout && !this.#promise && this.leading) {
                this.#createTimeout();
                return Promise.resolve(this.#apply());
            }
            if (this.#isTimeout && this.#promise === null) {
                return this.#createPromise(false);
            }
        }

        if (this.#isThrottle === false) {
            if (!this.leading && this.#resolve) {
                this.#createTimeout(this.#resolve);
                return this.#promise;
            } else if (this.leading && !this.#resolve && !this.#isTimeout) {
                this.#createTimeout();
                return Promise.resolve(this.#apply());
            }
        }

        return this.#createPromise(true);
    }

    /**
     * Executes the function immediately without waiting for the delay.
     * @param {...any} args - Optional arguments to be passed to the function.
     * @returns {any} - The result of the executed function.
     */
    execute = (...args) => {
        this.stop("Execute now!");
        if (typeof this.#callback != 'function') { throw new Error('The function is missing.'); }

        if (args.length > 0) {
            return this.#apply(args);
        }
        return this.#apply(this.#savedArgs);
    }

    /**
     * Stops the execution of the function.
     * @param {string} cause - The cause for stopping the execution.
     */
    stop = (cause = "Forecd stopp.") => {
        clearTimeout(this.#timeoutId);
        this.#isTimeout = false;
        this.#promise = null;
        this.#resolve = null;
        this.#reject = null;

        if (typeof this.#fulfilled === 'function') {
            this.#fulfilled(cause);
            this.#fulfilled = undefined;
        }
    }
}