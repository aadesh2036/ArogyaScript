class APIError extends Error {
    constructor(message, statusCode = 500, data = null) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.data = data;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(msg, data) {
        return new APIError(msg, 400, data);
    }

    static unauthorized(msg = 'Unauthorized') {
        return new APIError(msg, 401);
    }

    static forbidden(msg = 'Forbidden') {
        return new APIError(msg, 403);
    }

    static notFound(msg = 'Resource not found') {
        return new APIError(msg, 404);
    }

    static conflict(msg) {
        return new APIError(msg, 409);
    }

    static internal(msg = 'Internal server error') {
        return new APIError(msg, 500);
    }
}

module.exports = APIError;
