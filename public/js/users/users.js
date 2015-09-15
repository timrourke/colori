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
    updateUser: function(username, updatedUser, success, error) {
      $http.put(urls.BASE + '/users/' + username, updatedUser).then(function(res){
        success(res.data);
      }, function(err){
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

  $scope.user = [];

  if ($rootScope.currentUser.UserProfile) {
    $scope.updatedUser = {
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

  $scope.showSocial = true;
  $scope.showForm = true;
  $scope.showUpdateUserProfile = false;

  $scope.toggleUpdateUserProfile = function(){
    $scope.showUpdateUserProfile = !$scope.showUpdateUserProfile;
  }

  $scope.init = function() {
    Users.getUser(
      $stateParams.username,
      function(res) {
        $scope.user = res.foundUser;
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
      }, function(err){
        console.log(err);
      });
  }

  $scope.init();

  $scope.updateUser = function(updatedUser){
    Users.updateUser($stateParams.username, updatedUser, function(res) {
      $rootScope.currentUser = res.updatedUser;
      $scope.updatedUser = res.updatedUser;
      $scope.updatedUser.password = '';
      $scope.updatedUser.confirmpassword = '';
      if (Auth.getUser().id == res.updatedUser.id) {
        Auth.setUser(res.updatedUser);
      }
    }, function(err) {

    });
  }

  $scope.uploadAvatar = function(file){
    file.upload = Upload.upload({
      url: urls.BASE + '/users/' + $stateParams.username + '/avatar',
      method: 'POST',
      fields: {username: $scope.updatedUser.username},
      file: file,
      fileFormDataName: $scope.updatedUser.username
    });

    file.upload.then(function (response) {
      $timeout(function () {
        $rootScope.currentUser.UserProfile.avatar_url = response.data.url;
        file.result = response.data;
      });
    }, function (response) {
      if (response.status > 0)
        $scope.errorMsg = response.status + ': ' + response.data;
    });

    file.upload.progress(function (evt) {
      // Math.min is to fix IE which reports 200% sometimes
      file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
    });
  }

}])