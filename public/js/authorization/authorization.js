angular.module('coloriAppAuthorization', ['ngStorage', 'ui.router', 'angular-jwt'])
.factory('Auth', ['$rootScope', '$http', '$localStorage', 'urls', '$location', function($rootScope, $http, $localStorage, urls, $location) {
  
	  return {
	    signup: function (data, success, error) {
	      $http.post(urls.BASE + '/auth/signup', data).then(function(res){
	        success
	      }, function(res) {
	        error
	      });
	    },
	    login: function (data, success, error) {
	      $http.post(urls.BASE + '/auth/login', data)
	      .then(function(res){
	        success(res.data)
	      }, function(res) {
	        error(res.data)
	      });
	    },
	    logout: function () {
	      data = {
	        user: $localStorage.user,
	        token: $localStorage.id_token
	      }
	      $http.get(urls.BASE + '/auth/logout', data)
	        .then(function(res) {
	          delete $localStorage.id_token;
	          delete $localStorage.user;
	          $rootScope.message = res.data.message;
	          $location.path('/'); 
	        }, function(res){
	          delete $localStorage.id_token;
	          delete $localStorage.user;
	          //$rootScope.message = res.message;
	          $location.path('/');
	        });
	      
	    },
	    getToken: function () {
	      return $localStorage.id_token;  
	    },
	    setUser: function(user) {
	      return $localStorage.user = user;
	    },
	    getUser: function() {
	      if ($localStorage.hasOwnProperty('user')) {
	        return $localStorage.user;  
	      } else {
	        return "";
	      }
	    },
	    successAuth: function(res) {
	      $localStorage.id_token = res.user.token;
	      $localStorage.user = res.user;
	      $rootScope.message = res.user.message;
	      $location.path('/');
	    }
	  };

	}])
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
	.controller('LoginController', ['$rootScope', '$scope', '$location', '$localStorage', 'Auth', 
  function LoginController($rootScope, $scope, $location, $localStorage, Auth) {

    $scope.$watch(function(scope){
      return Auth.getUser()
    }, function(newValue, OldValue) {
      $rootScope.user = newValue;
    });

    $scope.loginCredentials = {
      username: '',
      password: ''
    }

    $scope.login = function (loginCredentials) {
      var loginFormData = {
        username: $scope.loginCredentials.username,
        password: $scope.loginCredentials.password
      };

      Auth.login(loginFormData, function(res){
        Auth.successAuth(res);
        $scope.loginCredentials = {
          username: '',
          password: ''
        }
      }, function (res) {
        $rootScope.message = res.message;
      });
    };

    $scope.logout = function () {
      Auth.logout();
    };

  }
])
.controller('SignupController', ['$rootScope', '$scope', 'Auth', function($rootScope, $scope, Auth) {

  $scope.signup = function () {
    var formData = {
      username: $scope.username,
      email: $scope.email,
      password: $scope.password
    };

    Auth.signup(formData, Auth.successAuth, function (res) {
      $rootScope.message = res.message || 'Failed to sign up.';
    });
  };
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

  $scope.users = [];

  $scope.updatedUser = {
    username: '',
    password: ''
  };

  $scope.showForm = false;

  $scope.init = function() {
    Users.getUser(
      $stateParams.username,
      function(res) {
        $scope.users[0] = res.foundUser;
        if ($scope.users[0].id == Auth.getUser().id) {
          return $scope.showForm = true;
        }
        $rootScope.message = res.message;
      }, function(res) {
        $rootScope.message = res.message;
      }
    );
  }

  $scope.init();

  $scope.updateUser = function(updatedUser){
    Users.updateUser($stateParams.username, updatedUser, function(res) {
      $scope.users[0] = res.updatedUser;
      $scope.updatedUser = {
        username: '',
        password: ''
      };
      $rootScope.message = res.message;
      if (Auth.getUser().id == res.updatedUser.id) {
        Auth.setUser(res.updatedUser);
      }
    }, function(err) {
      $scope.updatedUser = '';
      $rootScope.message = err.message;
    });
  }

}]);