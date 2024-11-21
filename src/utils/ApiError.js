class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],  // Fixed here: changed `error` to `errors`
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;  // Now correctly using `errors`

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };
