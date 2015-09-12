"use strict";

var debug = require('debug')('app:routes:gradients' + process.pid),
    _ = require("lodash"),
    util = require('util'),
    path = require('path'),
    async = require('async'),
    Router = require("express").Router,
    tokenUtils = require(path.join(__dirname, '..', '..', 'utils', 'tokenUtils')),
    gradientUtils = require(path.join(__dirname, '..', '..', 'utils', 'gradientUtils')),
    srs = require('secure-random-string'),
    UnauthorizedAccessError = require(path.join(__dirname, '..', '..', 'errors', 'UnauthorizedAccessError'));

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

  router.route('/:permalink').get(function(req, res, next) {
    Gradient.findOne({ where: { permalink: req.params.permalink }, include: [{ model: User }, { model: Comment }] }).then(function(gradient) {

      if (!gradient) {
        res.status(404).json({ success: false, message: 'No gradients found with a permalink of ' + req.params.permalink + '.' });
      } else {
        res.status(200).json({
          success: true,
          message: '1 gradient found.',
          gradientFound: gradient
        }); 
      }

    }).catch(function(err) {
      console.log(err);
      return next(err);
    });
  });

  function generateSrs(length, callback) {
    srs({ length: length }, function(err, sr){
      if (err) {
        callback(err);
      } else {
        callback(null, sr);
      }
    });
  }

  function assignGradientPermalink(callback) {
    generateSrs(8, function(err, srs){
      if (err) return next(err);

      //Make sure permalink value does not contain underscores and hyphens.
      if (srs.indexOf('-') != -1 || srs.indexOf('_') != -1) {
        return assignGradientPermalink(callback);
      }

      Gradient.findOne({ where: { permalink: srs } }).then(function(existingGradientWithPermalink){
        if (existingGradientWithPermalink) {
          assignGradientPermalink(callback);
        } else {
          callback(null, srs);
        }
      }).catch(function(err){
        console.log(err);
        callback(err);
      });

    });  
  }

  router.route('/').post(tokenUtils.middleware(), function(req, res, next) {

    var gradientObject = req.body;

    assignGradientPermalink(function(err, srs){
      if (err) return next(err);

      gradientObject.permalink = srs; 

      gradientUtils.autoprefixCss(gradientObject.body, function(err, autoprefixedCss){
        gradientObject.body_autoprefixed = autoprefixedCss;

        Gradient.create(gradientObject).then(function(gradient){

          User.findOne({ where: { id: req.user.id } }).then(function(author){

            if (!author){

              return next(new UnauthorizedAccessError("invalid_token", {
                success: false,
                message: 'You must be logged in to save a new gradient.'
              }));

            } else {

              gradient.setUser(author).then(function(authoredGradient){
                res.status(200).json({
                  success: true,
                  message: 'Gradient created.',
                  gradientCreated: authoredGradient
                }); 
              }).catch(function(err){
                console.log(err);
                return next(err);
              });

            }

          }).catch(function(err){
            console.log(err);
            return next(err);
          });

        }).catch(function(err){
          console.log(err);
          return next(err);
        });

      });

    });

  });

  router.unless = require("express-unless");

  return router;
};

debug("Loaded");