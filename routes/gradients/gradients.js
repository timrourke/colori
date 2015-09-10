"use strict";

var debug = require('debug')('app:routes:gradients' + process.pid),
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
    Gradient.findAll({ include: [{ model: User }, { model: Comment }] }).then(function(gradients) {
      
      if (gradients.length == 0) {
        res.status(404).json({ success: false, message: 'No gradients found.' });
      } else {
        res.status(200).json({
          success: true,
          message: (gradients.length > 1) ? gradients.length + ' gradients found.' : '1 gradient found.',
          gradientsFound: gradients
        }); 
      }
      
    }).catch(function(err){
      console.log(err);
      return next(err);
    });
  });

  router.route('/').post(tokenUtils.middleware(), function(req, res, next) {

    Gradient.create(req.body).then(function(gradient){

      User.findById(req.user.id).then(function(author){

        if (!author || author.length == 0){

          return next(new UnauthorizedAccessError("invalid_token", {
            success: false,
            message: 'You must be logged in to add create a gradient.'
          }));

        } else {

          gradient.setUser(author).then(function(authoredGradient){
            res.status(200).json({
              success: true,
              message: (authoredGradient.length > 1) ? authoredGradient.length + ' gradients created.' : '1 gradient created.',
              commentCreated: authoredGradient
            }); 
          }).catch(function(err){
            return next(err);
          });

        }

      }).catch(function(err){
        return next(err);
      });

    }).catch(function(err){
      console.log(err);
      return next(err);
    });

  });

  router.unless = require("express-unless");

  return router;
};

debug("Loaded");