"use strict";

var debug = require('debug')('app:routes:comments' + process.pid),
    _ = require("lodash"),
    util = require('util'),
    path = require('path'),
    tokenUtils = require(path.join(__dirname, '..', '..', 'utils', 'tokenUtils')),
    async = require('async'),
    Router = require("express").Router,
    UnauthorizedAccessError = require(path.join(__dirname, '..', '..', 'errors', 'UnauthorizedAccessError.js'));;

module.exports = function (Models) {

  var User = Models.User;
  var UserProfile = Models.UserProfile;
  var Gradient = Models.Gradient;
  var Comment = Models.Comment;

  var router = new Router();

  router.route('/').get(function(req, res, next) {
    Comment.findAll({ include: [{model: User}, {model: Gradient}] }).then(function(comments) {

      if (comments.length == 0) {
        res.status(404).json({ success: false, message: 'No comments found.' });
      } else {
        res.status(200).json({
          success: true,
          message: (comments.length > 1) ? comments.length + ' comments found.' : '1 comment found.',
          commentsFound: comments
        });   
      }

    }).catch(function(err){
      return next(err);
    });
  });

  router.route('/').post(tokenUtils.middleware(), function(req, res, next) {

    Comment.create(req.body).then(function(comment){

      User.findById(req.user.id).then(function(author){

        if (!author || author.length == 0){

          return next(new UnauthorizedAccessError("invalid_token", {
            success: false,
            message: 'You must be logged in to comment.'
          }));

        } else {

          comment.setUser(author).then(function(authoredComment){
            res.status(200).json({
              success: true,
              message: (authoredComment.length > 1) ? authoredComment.length + ' comments created.' : '1 comment created.',
              commentCreated: authoredComment
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