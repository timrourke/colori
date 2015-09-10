"use strict";

var debug       = require('debug')('app:userUtils:' + process.pid),
    path        = require('path'),
    util        = require('util'),
    _           = require("lodash"),
    config      = require(path.join(__dirname, '..', 'config', 'config')),
    tokenUtils  = require(path.join(__dirname, '/tokenUtils.js'));

module.exports.createUserProfile = function (user, req, res, next) {

    debug("Create user profile");

    if (_.isEmpty(user)) {
        return next(new Error('User data cannot be empty.'));
    }

    var newUserProfile = new UserProfile({});

    newUserProfile._creator = user;

    newUserProfile.save(function(err) {
        if (err) {
            return next(new Error(err));
        }

        debug("User profile generated for user: %s", user.username);

        tokenUtils.create(user, req, res, next);

    });

};

debug("Loaded");