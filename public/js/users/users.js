angular.module('coloriAppUsers', [])
.factory('Users', ['$http', 'urls', function($http, urls) {
  return {
    getUsers: function(success, error) {
      $http.get(urls.BASE + '/users').then(function(res){
        success(res.data);
      }, function(err) {
        error(err.data);
      });
    },
    getUser: function(username, success, error) {
      $http.get(urls.BASE + '/users/' + username).then(function(res){
        success(res.data);
      }, function(err) {
        error(err.data);
      });
    },
    commentOnUser: function(username, comment, success, error) {
      console.log('attempting post request');
      $http.post(urls.BASE + '/users/' + username + '/comment', comment).then(function(res){
        success(res.data);
      }, function(err){
        error(err.data);
      });
    },
    updateUser: function(username, updatedUser, success, error) {
      $http.put(urls.BASE + '/users/' + username, updatedUser).then(function(res){
        success(res.data);
      }, function(err){
        error(err.data);
      });
    },
    confirmEmailVerificationUUID: function(uuid, success, error) {
      $http.get(urls.BASE + '/auth/confirm-email/' + uuid).then(function(res){
        success(res.data);
      }, function(err) {
        error(err.data);
      });
    }
  }
}])
.controller('UsersController', ['$rootScope', '$scope', '$stateParams', 'Users', function($rootScope, $scope, $stateParams, Users) {

  $scope.users = [];

  $scope.init = function() {
    Users.getUsers(function(res) {
      $scope.users = res.foundUsers;
    }, function(err) {
      $rootScope.message = err.message;
    });
  }

  $scope.init();

}])
.controller('UserController', ['$rootScope', '$scope', 'Users', 'Auth', 'gradientService', '$stateParams', '$timeout', 'Upload', 'urls', 
  function($rootScope, $scope, Users, Auth, gradientService, $stateParams, $timeout, Upload, urls) {

  function getUserTotalStats(gradients){
    console.log(gradients);
    var hearts = 0;
    var views = 0;
    for (var i = 0; i < gradients.length; i++){
      hearts += gradients[i].Hearts.length;
      views += gradients[i].views;
    }
    $scope.user.totalhearts = hearts;
    $scope.user.totalviews = views;
  }  

  $scope.user = [];
  $scope.comments = [];

  $scope.totalhearts = 0;
  $scope.totalviews = 0;

  $scope.showProfile = true;
  $scope.showSocial = false;
  $scope.showForm = true;
  $scope.showUpdateUserProfile = false;

  $scope.toggleUpdateUserProfile = function(){
    $scope.showUpdateUserProfile = !$scope.showUpdateUserProfile;
  }

  $scope.toggleUserProfile = function(){
    console.log($scope.showProfile)
    $scope.showProfile = !$scope.showProfile;
  }

  $scope.newComment = {
    body: ''
  }

  $scope.commentOnUser = function(newComment) {
    Users.commentOnUser($stateParams.username, newComment,
      function(res){
        $scope.user = res.commentedUser;
        $scope.comments = res.commentedUser.UserProfile.Comments;
        $scope.newComment = {
          body: ''
        }
      }, function(err){
        console.log(err);
      });
  }

  $scope.init = function() {
    Users.getUser(
      $stateParams.username,
      function(res) {
        $scope.user = res.foundUser;
        $scope.comments = res.foundUser.UserProfile.Comments;
        if ($scope.user.id == Auth.getUser().id) {
          return $scope.showForm = true;
        } else {
        	return $scope.showForm = false;
        }
      }, function(res) {
        $rootScope.message = res.message;
      }
    );
    gradientService.getGradientsByUsername(
      $stateParams.username,
      function(res){
        $scope.gradientItems = res.gradientsFound;
        getUserTotalStats(res.gradientsFound);
      }, function(err){
        console.log(err);
      });
  }

  $scope.init();

  

}]).controller('ConfirmEmailController', ['$scope', '$stateParams', '$location', 'Users',  function($scope, $stateParams, $location, Users){

  $scope.init = function() {
    if (!$stateParams.email_verification_uuid) {
      $location.path('/');
    } else if ($stateParams.email_verification_uuid != '') {
      Users.confirmEmailVerificationUUID($stateParams.email_verification_uuid,
        function(res){
          console.log(res);
          $location.path('/login');
        }, function(err){
          console.log(err);
          $location.path('/');
        });
    }
  }

  $scope.init();

}])
.directive('userProfile', ['$rootScope', '$timeout', '$stateParams', 'Users', 'Auth', 'Upload', 'urls', 'ToastFactory',
  function($rootScope, $timeout, $stateParams, Users, Auth, Upload, urls, ToastFactory){

    return {
      restrict: 'E',
      scope: {
        show: '='
      },
      templateUrl: '/partials/directives/user-profile-editor.html',
      link: function(scope, element, attributes){

        if ($rootScope.currentUser && $rootScope.currentUser.UserProfile) {
          scope.updatedUser = {
            username: $rootScope.currentUser.username,
            email: $rootScope.currentUser.email,
            password: '',
            confirmpassword: '',
            UserProfile: {
              avatar_url: $rootScope.currentUser.UserProfile.avatar_url,
              bio: $rootScope.currentUser.UserProfile.bio,
              website: $rootScope.currentUser.UserProfile.website,
              twitter_handle: $rootScope.currentUser.UserProfile.twitter_handle,
              facebook_handle: $rootScope.currentUser.UserProfile.facebook_handle,
              github_handle: $rootScope.currentUser.UserProfile.github_handle,
              dribble_handle: $rootScope.currentUser.UserProfile.dribble_handle,
              codepen_handle: $rootScope.currentUser.UserProfile.codepen_handle
            }
          };
        }

        scope.close = function(){
          scope.show = !scope.show;
        }

        scope.updateUser = function(updatedUser){
          Users.updateUser($stateParams.username, updatedUser, function(res) {
            $rootScope.currentUser = res.updatedUser;
            scope.updatedUser = res.updatedUser;
            scope.updatedUser.password = '';
            scope.updatedUser.confirmpassword = '';
            if (Auth.getUser().id == res.updatedUser.id) {
              Auth.setUser(res.updatedUser);
            }
            ToastFactory('User profile successfully updated.', 3000, 'success').then(function(){
              console.info('User profile successfully updated.');
            }); 
          }, function(err) {

          });
        }

        scope.uploadAvatar = function(file){
          file.upload = Upload.upload({
            url: urls.BASE + '/users/' + $stateParams.username + '/avatar',
            method: 'POST',
            fields: {username: scope.updatedUser.username},
            file: file,
            fileFormDataName: scope.updatedUser.username
          });

          file.upload.then(function (response) {
            $timeout(function () {
              console.log(response);
              $rootScope.$apply(function(){
                $rootScope.currentUser.UserProfile.avatar_url = response.data.url;  
              })
              
              file.result = response.data;

            });
            ToastFactory('User avatar successfully updated.', 3000, 'success').then(function(){
              console.info('User avatar successfully updated.');
            }); 
          }, function (response) {
            if (response.status > 0)
              scope.errorMsg = response.status + ': ' + response.data;
          });

          file.upload.progress(function (evt) {
            // Math.min is to fix IE which reports 200% sometimes
            file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
          });
        }

      }  
    }
    

}])