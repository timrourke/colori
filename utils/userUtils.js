"use strict";

var debug       = require('debug')('app:userUtils:' + process.pid),
    path        = require('path'),
    util        = require('util'),
    _           = require("lodash"),
    config      = require(path.join(__dirname, '..', 'config', 'config')),
    tokenUtils  = require(path.join(__dirname, '/tokenUtils.js'));

module.exports.createUserProfile = function (Models, user, req, res, next) {

    console.log('Beginning user profile creation');

    var User = Models.User;
    var UserProfile = Models.UserProfile;
    var Gradient = Models.Gradient;
    var Comment = Models.Comment;

    debug("Create user profile");

    if (_.isEmpty(user)) {
        return next(new Error('User data cannot be empty.'));
    }

    UserProfile.create({}).then(function(newUserProfile){

        if (!newUserProfile || newUserProfile.length == 0) {
            return next(err);
        } else {
            newUserProfile.setUser(user).then(function(assignedNewUserProfile){
                console.log("User profile generated for user: %s", user.username);

                debug("User profile generated for user: %s", user.username);

                tokenUtils.create(user, req, res, next);
            }).catch(function(err){
                console.log(err);
                return next(err);
            });
        }

    }).catch(function(err){
        console.log(err);
        next(err);
    });

};

debug("Loaded");