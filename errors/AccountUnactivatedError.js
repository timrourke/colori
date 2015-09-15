"use strict";
function AccountUnactivatedError(code, error) {
    Error.call(this, error.message);
    Error.captureStackTrace(this, this.constructor);
    this.name = "AccountUnactivatedError";
    this.message = error.message;
    this.code = code;
    this.status = 401;
    this.inner = error;
}

AccountUnactivatedError.prototype = Object.create(Error.prototype);
AccountUnactivatedError.prototype.constructor = AccountUnactivatedError;

module.exports = AccountUnactivatedError;