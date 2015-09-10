"use strict";

var debug = require('debug')('app:tokenUtils:' + process.pid),
    path = require('path'),
    util = require('util'),
    redis = require("redis"),
    client = redis.createClient(),
    _ = require("lodash"),
    config = require(path.join(__dirname, '..', 'config', 'config')),
    jsonwebtoken = require("jsonwebtoken"),
    TOKEN_EXPIRATION = 60,
    TOKEN_EXPIRATION_SEC = TOKEN_EXPIRATION * 60,
    UnauthorizedAccessError = require(path.join(__dirname, '..', 'errors', 'UnauthorizedAccessError.js'));

client.on('error', function (err) {
    debug(err);
});

client.on('connect', function () {
    debug("Redis successfully connected");
    console.log('Redis successfully connected');
});

module.exports.fetch = function (headers) {
    if (headers && headers.authorization) {
        var authorization = headers.authorization;
        var part = authorization.split(' ');
        if (part.length === 2) {
            var token = part[1];
            return part[1];
        } else {
            return null;
        }
    } else {
        return null;
    }
};

module.exports.create = function (user, req, res, next) {

    debug("Create token");

    if (_.isEmpty(user)) {
        return next(new Error('User data cannot be empty.'));
    }

    var data = {
        id: user.id,
        username: user.username,
        email: user.email,
        token: jsonwebtoken.sign({ id: user.id }, config.secret, {
            expiresInMinutes: TOKEN_EXPIRATION
        })
    };

    var decoded = jsonwebtoken.decode(data.token);

    data.token_exp = decoded.exp;
    data.token_iat = decoded.iat;

    debug("Token generated for user: %s, token: %s", data.username, data.token);

    client.set(data.token, JSON.stringify(data), function (err, reply) {
        if (err) {
            return next(new Error(err));
        }

        if (reply) {
            client.expire(data.token, TOKEN_EXPIRATION_SEC, function (err, reply) {
                if (err) {
                    return next(new Error("Can not set the expire value for the token key"));
                }
                if (reply) {
                    req.user = data;
                    next(); // we have succeeded
                } else {
                    return next(new Error('Expiration not set on redis'));
                }
            });
        }
        else {
            return next(new Error('Token not set in redis'));
        }
    });

    return data;

};

module.exports.retrieve = function (id, done) {

    debug("Calling retrieve for token: %s", id);

    if (_.isNull(id)) {
        return done(new Error("token_invalid"), {
            "message": "Your user session is invalid or has expired. Please try to log in again."
        });
    }

    client.get(id, function (err, reply) {
        if (err) {
            return done(err, {
                "message": err
            });
        }

        if (_.isNull(reply)) {
            return done(new Error("token_invalid"), {
                "message": "Your user session is invalid or has expired. Please try to log in again."
            });
        } else {
            var data = JSON.parse(reply);

            debug("User data fetched from redis store for user: %s", data.username);

            if (_.isEqual(data.token, id)) {
                return done(null, data);
            } else {
                return done(new Error("token_doesnt_exist"), {
                    "message": "Your user session is invalid or has expired. Please try to log in again."
                });
            }

        }

    });

};

module.exports.verify = function (req, res, next) {

    debug("Verifying token");

    var token = exports.fetch(req.headers);

    jsonwebtoken.verify(token, config.secret, function (err, decode) {

        if (err) {
            req.user = undefined;
            return next(new UnauthorizedAccessError("invalid_token"));
        }

        exports.retrieve(token, function (err, data) {

            if (err) {
                req.user = undefined;
                return next(new UnauthorizedAccessError("invalid_token", data));
            }

            req.user = data;
            next();

        });

    });
};

module.exports.expire = function (headers) {

    var token = exports.fetch(headers);

    debug("Expiring token: %s", token);

    if (token !== null) {
        client.expire(token, 0);
    }

    return token !== null;

};

module.exports.middleware = function () {

    var func = function (req, res, next) {

        var token = exports.fetch(req.headers);

        exports.retrieve(token, function (err, data) {

            if (err) {
                req.user = undefined;
                return next(new UnauthorizedAccessError("invalid_token", data));
            } else {
                req.user = data;

                next();
            }

        });
    };

    func.unless = require("express-unless");

    return func;

};

module.exports.TOKEN_EXPIRATION = TOKEN_EXPIRATION;
module.exports.TOKEN_EXPIRATION_SEC = TOKEN_EXPIRATION_SEC;

debug("Loaded");