"use strict";

var debug = require('debug')('app:routes:users' + process.pid),
    _ = require("lodash"),
    util = require('util'),
    path = require('path'),
    tokenUtils = require(path.join(__dirname, '..', '..', 'utils', 'tokenUtils')),
    async = require('async'),
    Router = require("express").Router,
    multiparty = require('multiparty');;

module.exports = function (Models, s3bucket) {

  var User = Models.User;
  var UserProfile = Models.UserProfile;
  var Gradient = Models.Gradient;
  var Comment = Models.Comment;

  var router = new Router();

  router.route('/').get(function(req, res, next) {

    User.findAll({ attributes: ['id', 'username', 'email', 'is_admin', 'createdAt', 'updatedAt'], include: [ {model: UserProfile} ] }).then(function(users) {

      if (users.length == 0) {
        return res.status(404).json({ success: false, message: 'No users found.' });
      } else {
        res.json({
          success: true,
          message: (users.length > 1) ? users.length + ' users found.' : '1 user found.',
          foundUsers: users
        });  
      }

    }).catch(function(err){
      return next(err);
    });
  });

  var findUserByUsername = function(username, callback) {
    User.findOne({ 
      where: { username: username }, 
      include: { model: UserProfile }, 
      attributes: ['id', 'username', 'email', 'is_admin', 'createdAt', 'updatedAt'] }).then(function(user) {

      if (!user) {
        return callback(null, null);        
      } else {
        return callback(null, user)
      }

    }).catch(function(err) {
      return callback(err);
    });
  }

  var isUserInReqBodySelfOrAdmin = function(user, req, res, next){
    if (req.user.id != user.id && req.user.is_admin != true) {
      return next(new UnauthorizedAccessError('not_authorized', 'Sorry, you do not have access privileges to edit this resource.'));
    } else if (req.user.id == user.id || req.user.is_admin == true) {
      next();
    }
  }

  var findUserByUsernameAndUpdate = function(username, updatedUserProperties, req, res, callback) {
    User.findOne({ where: { username: username }, include: { model: UserProfile } }).then(function(user) {

      if (!user) {
        return callback(null, null);        
      } else {

        isUserInReqBodySelfOrAdmin(user, req, res, function(){

          if (updatedUserProperties.password && updatedUserProperties.password != updatedUserProperties.confirmpassword) {
            res.status(449).json({ success: false, message: "Sorry, your password was not changed. The new password must match the confirmation password." })
          }

          if (!updatedUserProperties.password) {
            user.update(updatedUserProperties, { fields: [ 'username', 'email' ] }).then(function(updatedUser) {
      
              if (!updatedUser || updatedUser == null) {
                return callback(null, null);
              } else {

                updatedUser.getUserProfile().then(function(updatedUserProfile){

                  updatedUserProfile.update(updatedUserProperties.UserProfile).then(function(finalUpdatedUserProfile){

                    updatedUser.dataValues.UserProfile = finalUpdatedUserProfile;

                    return callback(null, updatedUser);

                  }).catch(function(err){
                    console.log(err);
                    return callback(err);
                  });

                }).catch(function(err){
                  console.log(err);
                  return callback(err);
                });
                
              }

            }).catch(function(err){
              console.log(err);
              return callback(err);
            });

          } else {
            user.update(updatedUserProperties, { fields: [ 'username', 'email', 'password' ] }).then(function(updatedUser) {
      
              if (!updatedUser || updatedUser == null) {
                return callback(null, null);
              } else {

                updatedUser.getUserProfile().then(function(updatedUserProfile){

                  updatedUserProfile.update(updatedUserProperties.UserProfile).then(function(finalUpdatedUserProfile){

                    updatedUser.dataValues.UserProfile = finalUpdatedUserProfile;

                    return callback(null, updatedUser);

                  }).catch(function(err){
                    console.log(err);
                    return callback(err);
                  });

                }).catch(function(err){
                  console.log(err);
                  return callback(err);
                });
                
              }

            }).catch(function(err){
              console.log(err);
              return callback(err);
            });
          }

          
        });
      }

    }).catch(function(err) {
      return callback(err);
    });
  }

  router.route('/:username').get(function(req, res, next) {
    findUserByUsername(req.params.username, function(err, user) {
      if (err) {
        return next(err);
      } else if (!user || user == null) {
        res.status(404).json({ success: false, message: 'Sorry, no users found with the username ' + req.params.username + '.' }); 
      } else {
        
        //foundUser includes user, should also include their user profile.
        res.json({
          success: true,
          message: 'User found by username ' + req.params.username + '.',
          foundUser: user
        }); 
        
      }
      
    });
  });

  router.route('/:username').put(tokenUtils.middleware(), function(req, res, next) {
    findUserByUsernameAndUpdate(req.params.username, req.body, req, res, function(err, updatedUser) {
      if (err) {
        return next(err);
      } else if (!updatedUser || updatedUser == null) {
        res.status(404).json({ success: false, message: 'Sorry, no users found with the username ' + req.params.username + '.' }); 
      } else {

        var returnedUpdatedUser = updatedUser.get({
            plain: true
          });

        res.json({
          success: true,
          message: 'Thanks! User ' + updatedUser.username + ' was successfully updated.',
          updatedUser: _.omit(returnedUpdatedUser, ['password', 'email_verified', 'email_verification_uuid', 'password_reset_uuid'])
        }); 
        
      }
      
    });
  });

  router.route('/:username/avatar').post(tokenUtils.middleware(), function(req, res, next) {
    var form = new multiparty.Form({
      maxFields: 2
    });

    var destPath;

    //Set the destPath to be the uploading user's username.
    form.on('field', function(name, value){
      if (name === 'username') {
        destPath = 'avatar_' + value;
      }
    });

    //upload files to s3
    form.on('part', function(part){

      var fileExtension = part.filename.split('.');

      fileExtension = fileExtension[fileExtension.length - 1];

      if (fileExtension !== 'jpg' && fileExtension !== 'png') {
        console.log(fileExtension);
        console.log('filename error');
        return next(new Error('Incorrect file extension. Avatar images must be in .png or .jpg format with those exact extensions.'));
      }

      s3bucket.upload({
        Key: destPath + '.' + fileExtension,
        ACL: 'public-read',
        Body: part,
        ContentLength: part.byteCount
      }, function(err, data){
        if (err) {
          console.log(err);
          return next(err)
        }
      
        findUserByUsername(req.params.username, function(err, user){
          
          console.log(user);

          isUserInReqBodySelfOrAdmin(user, req, res, function(){

            user.getUserProfile().then(function(userProfile){
              userProfile.update({
                avatar_url: 'https://s3.amazonaws.com/colori/' + destPath + '.' + fileExtension
              }).then(function(updatedUserProfile){
                res.status(200).json({
                  success: true,
                  message: 'Thanks! Profile pic was successfully uploaded.',
                  url: 'https://s3.amazonaws.com/colori/' + destPath + '.' + fileExtension,
                  updatedUserProfile: updatedUserProfile
                });
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
    });

    form.parse(req);

  });

//var params = {Key: 'myKey', Body: 'Hello!'};
// s3bucket.upload(params, function(err, data) {
//     if (err) {
//       console.log("Error uploading data: ", err);
//     } else {
//       console.log("Successfully uploaded data to myBucket/myKey");
//     }
// });

  router.unless = require("express-unless");

  return router;
};

debug("Loaded");