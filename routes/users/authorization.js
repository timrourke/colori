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
    UnauthorizedAccessError = require(path.join(__dirname, '..', '..', 'errors', 'UnauthorizedAccessError.js')),
    AccountUnactivatedError = require(path.join(__dirname, '..', '..', 'errors', 'AccountUnactivatedError.js')),
    mailer = require(path.join(__dirname, '..', '..', 'mailer', 'mailer')),
    uuid = require('uuid');

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
        message: 'Invalid username or password.'
      }));
    }

    process.nextTick(function () {

      User.findOne({
          where: {username: username},
          include: [{ model: UserProfile }]
      }).then(function (user) {  

        if (!user || user.length == 0) {
          return next(new UnauthorizedAccessError("401", {
            message: 'Invalid username or password.'
          }));
        }

        if (user.email_verified != true) {
          console.log(user.email_verified)
          return next(new AccountUnactivatedError("401", {
            message: 'Sorry, you must verify your email to activate your account.'
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
        confirmpassword: req.body.confirmpassword,
        email: req.body.email,
        email_verification_uuid: uuid.v4(),
        is_admin: false
    }
    
    if (_.isEmpty(newUser.username)) {
      return res.status(400).json({ success: false, message: 'Signup failed. Please be sure to provide a username and try again.' });
    }

    if (_.isEmpty(newUser.password)) {
      return res.status(400).json({ success: false, message: 'Signup failed. Please make sure you provide a password.' });
    }

    if (_.isEmpty(newUser.password)) {
      return res.status(400).json({ success: false, message: 'Signup failed. Please include a valid email address so we can verify your account.' });
    }

    if (_.isEmpty(newUser.confirmpassword) || newUser.password !== newUser.confirmpassword) {
      return res.status(400).json({ success: false, message: 'Signup failed. Please make sure your password matches the conrimation password.' });
    }

    process.nextTick(function() {

      User.findOne({
        where: {username: newUser.username}
      }).then(function(user) {

        if (user) {
            res.status(400).json({ success:false, message: 'Sorry, signup failed. The username you selected has been taken. Please try another username.' });
        } else if (!user || user.length == 0) {

          User.create(newUser).then(function(user) {
            console.log('User saved successfully with ID of ' + user.id);

            mailer.confirmEmail(user, function(err, result){
              if (err) return next(err);

              userUtils.createUserProfile(Models, user, req, res, function(err, newUserProfile){
                if (err) return next(err);

                next(null, user);
              });
            });

          }).catch(function(err){
            //Failed to save to database.
            console.log(err);
            return next(err);
          });

        };

      }).catch(function(err){
        //Failure to create new user for unknown reason.
        return next(new UnauthorizedAccessError("401"));
      });

    });

  }

  var verifyUUID = function(req, res, next) {
    User.findOne({ where: { email_verification_uuid: req.params.email_verification_uuid } }).then(function(user){

      if (!user) {
        return res.status(404).json({ success: false, message: 'Sorry, the email verification link you provided appears to be invalid.' });
      } else if (user.email_verified == true) {
        return next();
      }

      user.update({ email_verified: true, email_verification_uuid: null }).then(function(verifiedUser){

        next();

      }).catch(function(err){
        console.log(err);
        return next(err);
      });

    }).catch(function(err){
      console.log(err);
      return next(err);
    });
  }

  var router = new Router();

  router.route("/signup").post(signup, function (err, user, req, res, next) {
    if (err) throw err;

    console.log('completed signup');

    return res.status(200).json({
      user: user.username,
      message: 'Welcome, ' + user.username + '! Your account was created. Please check your email for a confirmation message to activate your account.'
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

  router.route('/confirm-email/:email_verification_uuid').get(verifyUUID, function(req, res, next) {
    return res.status(200).json({
      "message": "Congratulations, you've activated your account!"
    });
  });

  router.unless = require("express-unless");

  return router;
};

debug("Loaded");