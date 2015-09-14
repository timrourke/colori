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
.controller('UserController', ['$rootScope', '$scope', 'Users', 'Auth', '$stateParams', function($rootScope, $scope, Users, Auth, $stateParams) {

  $scope.user = [];

  $scope.updatedUser = {
    username: $rootScope.user.username,
    email: $rootScope.user.email,
    password: '',
    confirmpassword: '',
    UserProfile: {
      avatar_url: $rootScope.user.UserProfile.avatar_url,
      bio: $rootScope.user.UserProfile.bio,
      website: $rootScope.user.UserProfile.website,
      twitter_handle: $rootScope.user.UserProfile.twitter_handle,
      facebook_handle: $rootScope.user.UserProfile.facebook_handle,
      github_handle: $rootScope.user.UserProfile.github_handle,
      dribble_handle: $rootScope.user.UserProfile.dribble_handle,
      codepen_handle: $rootScope.user.UserProfile.codepen_handle
    }
  };

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
        console.log(res.foundUser);
        console.log(Auth.getUser());
        console.log($scope.user);
        if ($scope.user.id == Auth.getUser().id) {
          return $scope.showForm = true;
        } else {
        	return $scope.showForm = false;
        }
      }, function(res) {
        $rootScope.message = res.message;
      }
    );
  }

  $scope.init();

  $scope.updateUser = function(updatedUser){
    Users.updateUser($stateParams.username, updatedUser, function(res) {
      $rootScope.user = res.updatedUser;
      $scope.updatedUser = res.updatedUser;
      $scope.updatedUser.password = '';
      $scope.updatedUser.confirmpassword = '';
      if (Auth.getUser().id == res.updatedUser.id) {
        Auth.setUser(res.updatedUser);
      }
    }, function(err) {

    });
  }

}])