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
  var Heart = Models.Heart;

  var router = new Router();

  router.route('/').get(function(req, res, next) {
    Gradient.findAll({ 
      include: [
        { 
          model: User, attributes: ['id', 'username', 'email', 'is_admin', 'createdAt', 'updatedAt'],
            include: [{ model: UserProfile }]
        }, 
        { 
          model: Comment, 
            include: [{ model: User, attributes: ['id', 'username', 'email', 'is_admin', 'createdAt', 'updatedAt'],
              include: [{ model: UserProfile }] 
            }] 
        },{
          model: Heart
        }] 
      }).then(function(gradients) {
      
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
    Gradient.findOne({ 
      where: { permalink: req.params.permalink }, 
      include: [
        { 
          model: User, attributes: ['id', 'username', 'email', 'is_admin', 'createdAt', 'updatedAt'],
          include: [{ model: UserProfile }] 
        }, 
        { 
          model: Comment, 
          include: [{ model: User, attributes: ['id', 'username', 'email', 'is_admin', 'createdAt', 'updatedAt'],
            include: [{ model: UserProfile }]
          }] 
        },{
          model: Heart
        }] 
      }).then(function(gradient){

        gradient.increment({ views: 1 }).then(function(incrementedGradient) {

        if (!incrementedGradient) {
          return res.status(404).json({ success: false, message: 'No gradients found with a permalink of ' + req.params.permalink + '.' });
        } else {

          incrementedGradient.User.dataValues = _.omit(incrementedGradient.User.dataValues, ['password', 'email_verified', 'email_verification_uuid', 'password_reset_uuid']);

          res.status(200).json({
            success: true,
            message: '1 gradient found.',
            gradientFound: incrementedGradient
          }); 
        }

      }).catch(function(err){
        console.log(err);
        return next(err);
      });

    }).catch(function(err) {
      console.log(err);
      return next(err);
    });
  });

  router.route('/:permalink/heart').post(tokenUtils.middleware(), function(req, res, next){
    Gradient.findOne({
      where: { permalink: req.params.permalink },
        include: [
          { 
            model: User, attributes: ['id', 'username', 'email', 'is_admin', 'createdAt', 'updatedAt'],
            include: [{ model: UserProfile }] 
          }, 
          { 
            model: Comment, 
            include: [{ model: User, attributes: ['id', 'username', 'email', 'is_admin', 'createdAt', 'updatedAt'],
              include: [{ model: UserProfile }]
            }] 
          },{
            model: Heart
          }]
    }).then(function(gradient){

      if (!gradient) {
        return res.status(404).json({ success: false, message: 'No gradients found with a permalink of ' + req.params.permalink + '.' });
      } else {

        gradient.getHearts({ 
          where: { UserId: req.user.id, GradientId: gradient.id }
        }).then(function(hearts){

          if (!hearts || hearts.length == 0) {

            User.findOne({ where: { id: req.user.id } }).then(function(user){

              Heart.create().then(function(newHeart){
                
                gradient.addHeart(newHeart).then(function(newlyAssignedGradient){

                  newHeart.setUser(user).then(function(assignedGradientHeart){

                    newlyAssignedGradient.getHearts().then(function(finalGradientHearts){

                      var finalGradient = newlyAssignedGradient.dataValues;

                      finalGradient.Hearts = finalGradientHearts;

                      res.status(200).json({
                        success: true,
                        message: '1 gradient found.',
                        gradientFound: finalGradient
                      });

                    }).catch(function(err){
                      console.log(err);
                      return next(err);
                    });;

                  }).catch(function(err){
                    console.log(err);
                    return next(err);
                  });;

                }).catch(function(err){
                  console.log(err);
                  return next(err);
                });;

              }).catch(function(err){
                console.log(err);
                return next(err);
              });;

            }).catch(function(err){
              console.log(err);
              return next(err);
            });;

          } else {
            return res.status(304);
          }

        });

      }

    }).catch(function(err){
      console.log(err);
      return next(err);
    });
  });

  router.route('/by/:username').get(function(req, res, next) {
    User.findOne({
      where: { username: req.params.username }, 
      include: [
        { 
          model: Gradient,
            include: [{
              model: User,
                include: [{ model: UserProfile }]
            },{ 
              model: Comment, 
                include: [
                  { model: User, attributes: ['id', 'username', 'email', 'is_admin', 'createdAt', 'updatedAt'],
                    include: [{ model: UserProfile }] 
                  },{
                    model: Heart
                  }] 
            },{
              model: Heart
            }]
        }] 
      }).then(function(user) {
      
      if (user.length == 0) {
        res.status(404).json({ success: false, message: 'No gradients by ' + req.params.username + ' found.' });
      } else {
        console.log(user);
        res.status(200).json({
          success: true,
          message: (user.Gradients.length > 1) ? user.Gradients.length + ' gradients found by ' + req.params.username + '.' : '1 gradient found by ' + req.params.username + '.',
          gradientsFound: user.Gradients
        }); 
      }
      
    }).catch(function(err){
      console.log(err);
      return next(err);
    });
  });

  router.route('/:permalink/comment').post(tokenUtils.middleware(), function(req, res, next) {
    Gradient.findOne({ where: { permalink: req.params.permalink }, 
      include: [{ 
        model: User, attributes: ['id', 'username', 'email', 'is_admin', 'createdAt', 'updatedAt']  
      }, { 
        model: Comment, 
          include: [{ model: User, attributes: ['id', 'username', 'email', 'is_admin', 'createdAt', 'updatedAt'],
            include: [{ model: UserProfile }] 
      }] 
    }] }).then(function(gradient) {

      if (!gradient) {
        res.status(404).json({ success: false, message: 'No gradients found with a permalink of ' + req.params.permalink + '.' });
      } else {

        User.findOne({ where: { id: req.user.id } }).then(function(author){

          if (!author){

            return next(new UnauthorizedAccessError("invalid_token", {
              success: false,
              message: 'You must be logged in to comment.'
            }));

          } else {

            Comment.create(req.body).then(function(comment){

              comment.setUser(author).then(function(authoredComment){

                gradient.addComment(authoredComment).then(function(savedGradientWithComment){

                  author.getUserProfile().then(function(completeUser){

                    author.dataValues.UserProfile = completeUser;
                    authoredComment.dataValues.User = author;

                    res.status(200).json({
                      success: true,
                      message: 'Comment created.',
                      commentCreated: authoredComment 
                    });

                  }).catch(function(err){
                    console.log(err);
                    return next(err);
                  });

                }).catch(function(err){
                  console.log(err);
                  return next(err);
                });

              }).catch(function(err){
                console.log(err);
                return next(err);
              });

            }).catch(function(err){
              console.log(err);
              return next(err);
            });

          } // end if/else block checking for author

        }).catch(function(err){
          console.log(err);
          return next(err);
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

  router.route('/').post(function (req, res, next) {
      var token = tokenUtils.fetch(req.headers);

      if (token) {
        tokenUtils.retrieve(token, function (err, data) {

          if (err) {
            req.user = undefined;
            return next(new UnauthorizedAccessError("invalid_token", data));
          } else {
            req.user = data;

            next();
          }

        });  
      } else {
        //If no token is present, assign req.user to 'anonymous' for query assignment below
        req.user = 'anonymous';

        next();
      }
      
    }, 
    function(req, res, next) {

      var gradientObject = req.body;

      assignGradientPermalink(function(err, srs){
        if (err) return next(err);

        gradientObject.permalink = srs; 

        gradientUtils.autoprefixCss(gradientObject.body, function(err, autoprefixedCss){
          gradientObject.body_autoprefixed = autoprefixedCss;

          //Dynamically assign user query depending upon whether a user is currently logged in
          var userQuery;

          if (req.user && req.user !== 'anonymous') {
            userQuery = { id: req.user.id };
          } else if (req.user === 'anonymous' || !req.user) {
            userQuery = { username: 'Anonymous' };
          }

          User.findOne({ where: userQuery }).then(function(author){

            if (!author){

              return next(new UnauthorizedAccessError("invalid_token", {
                success: false,
                message: 'You must be logged in to save a new gradient.'
              }));

            } else {

              Gradient.create(gradientObject).then(function(gradient){

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

              }).catch(function(err){
                console.log(err);
                return next(err);
              });

            } // end if/else block checking for author

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