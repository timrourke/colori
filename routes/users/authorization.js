"use strict";

var debug = require('debug')('app:routes:authorization' + process.pid),
    _ = require("lodash"),
    util = require('util'),
    path = require('path'),
    async = require('async'),
    bcrypt = require('bcryptjs'),
    tokenUtils = require(path.join(__dirname, '..', '..', 'utils', 'tokenUtils')),
    userUtils = require(path.join(__dirname, '..', '..', 'utils', 'userUtils')),
    Router = require("express").Router,
    UnauthorizedAccessError = require(path.join(__dirname, '..', '..', 'errors', 'UnauthorizedAccessError.js'));

module.exports = function (Models) {

  var User = Models.User;
  var UserProfile = Models.UserProfile;
  var Gradient = Models.Gradient;
  var Comment = Models.Comment;

  var authenticate = function (req, res, next) {

    debug("Processing authenticate middleware");

    var username = req.body.username,
        password = req.body.password;

    if (_.isEmpty(username) || _.isEmpty(password)) {
      return next(new UnauthorizedAccessError("401", {
        message: 'Invalid username or password'
      }));
    }

    process.nextTick(function () {

      User.findOne({
          where: {username: username},
          include: [{ model: UserProfile }]
      }).then(function (user) {  
        console.log(user);

        if (!user || user.length == 0) {
          return next(new UnauthorizedAccessError("401", {
            message: 'Invalid username or password'
          }));
        }

        user.comparePassword(password, function (err, isMatch) {
          if (isMatch && !err) {
            debug("User authenticated, generating token");
            console.log("user authenticated, generating token");
            tokenUtils.create(user, req, res, next);  
          } else {
            return next(new UnauthorizedAccessError("401", {
              message: 'Invalid username or password'
            }));
          }
        });
      }).catch(function(err){
        return next(new UnauthorizedAccessError("401", {
          message: 'Invalid username or password'
        }));
      });

    });

  };

  var signup = function(req, res, next) {

    var newUser = {
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        is_admin: false
    }
    
    if (_.isEmpty(newUser.username)) {
      res.status(400).json({ success: false, message: 'Signup failed. Username must not be blank.' });
    }

    if (_.isEmpty(newUser.password)) {
      res.status(400).json({ success: false, message: 'Signup failed. Password must not be blank.' });
    }

    if (_.isEmpty(newUser.password)) {
      res.status(400).json({ success: false, message: 'Signup failed. Email address must not be blank.' });
    }

    process.nextTick(function() {

      User.findOne({
        where: {username: newUser.username}
      }).then(function(user) {

        if (user) {
            res.status(400).json({ success:false, message: 'Signup failed. Username taken. Please try another username.' });
        } else if (!user || user.length == 0) {

          User.create(newUser).then(function(user) {
            console.log('User saved successfully with ID of ' + user.id);

            userUtils.createUserProfile(Models, user, req, res, next);
          }).catch(function(err){
            //Failed to save to database.
            console.log(err);
            next(err);
          });

        };

      }).catch(function(err){
        //Failure to create new user for unknown reason.
        return next(new UnauthorizedAccessError("401"));
      });

    });

  }

  var router = new Router();

  router.route("/signup").post(signup, function (req, res, next) {

      return res.status(200).json({
        user: req.user,
        message: 'User successfully created.'
      });  

  });

  router.route("/verify").get(function (req, res, next) {
    return res.status(200).json(undefined);
  });

  router.route("/logout").get(function (req, res, next) {
    if (tokenUtils.expire(req.headers)) {
      delete req.user;
      return res.status(200).json({
        "message": "User has been successfully logged out"
      });
    } else {
      return next(new UnauthorizedAccessError("401"));
    }
  });

  router.route("/login").post(authenticate, function (req, res, next) {
    return res.status(200).json({user: req.user });
  });

  router.unless = require("express-unless");

  return router;
};

debug("Loaded");