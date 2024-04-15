class ApiError extends Error {
    description = null;

    constructor(code, httpStatusCode, message) {
        super(message);
        this.code = code;
        this.statusCode = httpStatusCode;
    }
 
    describe(description) {
        const describedError = new ApiError(this.code, this.statusCode, this.message);
        describedError.description = description;
        return describedError;
    }
}

const ApiErrors = {
    userNotFound:       new ApiError(100,   404, "Не найдена учётная запись с указанной парой логина и пароля"),
}

module.exports ={
    name : "response",
     ApiErrors
    };