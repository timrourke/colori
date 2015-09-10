"use strict";

var debug = require('debug')('app:routes:userProfiles' + process.pid),
    _ = require("lodash"),
    util = require('util'),
    path = require('path'),
    async = require('async'),
    Router = require("express").Router;

module.exports = function (Models) {

  var User = Models.User;
  var UserProfile = Models.UserProfile;
  var Gradient = Models.Gradient;
  var Comment = Models.Comment;

  var router = new Router();

  router.route('/').get(function(req, res, next) {
    UserProfile.findAll({ include: { model: User, attributes: ['id', 'username', 'email', 'is_admin', 'createdAt', 'updatedAt'] } }).then(function(userProfiles) {
      
      if (userProfiles.length == 0) {
        res.status(404).json({ success: false, message: 'No user profiles found.' });
      } else {
        res.status(200).json({
          success: true,
          message: (userProfiles.length > 1) ? userProfiles.length + ' user profiles found.' : '1 user profile found.',
          userProfilesFound: userProfiles
        }); 
      }
      
    }).catch(function(err){
      console.log(err);
      return next(err);
    });
  });

  router.unless = require("express-unless");

  return router;
};

debug("Loaded");