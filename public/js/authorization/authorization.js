angular.module('coloriAppAuthorization', [])
.factory('Auth', ['$rootScope', '$http', '$localStorage', 'urls', '$location', 
	function($rootScope, $http, $localStorage, urls, $location) {
  
	  return {
	    signup: function (data, success, error) {
	      $http.post(urls.BASE + '/auth/signup', data).then(function(res){
	        success(res.data);
	      }, function(err) {
	        error(err.data);
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
	          $location.path('/'); 
	        }, function(res){
	          delete $localStorage.id_token;
	          delete $localStorage.user;
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
	      $location.path('/');
	    }
	  };

	}])
	.factory('SignupSuccess', ['$mdDialog', function($mdDialog){

    return function(message) {
      var alert = $mdDialog.alert()
        .title('Check your email!')
        .content(message)
        .ok('Close');
        return $mdDialog.show(alert);
    }

  }])
  .factory('SignupFailure', ['$mdDialog', function($mdDialog){

    return function(message) {
      var alert = $mdDialog.alert()
        .title('Sorry, we couldn\'t create your account.')
        .content(message)
        .ok('Close');
        return $mdDialog.show(alert);
    }

  }])
  .factory('LoginFailed', ['$mdDialog', function($mdDialog){

    return function(message) {
      var alert = $mdDialog.alert()
        .title('Couldn\'t log in!')
        .content(message)
        .ok('Close');
        return $mdDialog.show(alert);
    }

  }])
	.controller('LoginController', ['$rootScope', '$scope', '$location', '$localStorage', 'Auth', 'LoginFailed', 
  function LoginController($rootScope, $scope, $location, $localStorage, Auth, LoginFailed) {

    $scope.$watch(function(scope){
      return Auth.getUser()
    }, function(newValue, OldValue) {
      $rootScope.currentUser = newValue;
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
      }, function (err) {
        LoginFailed(err.message).then(function(){
          console.log('success');
        });
      });
    };

    $scope.logout = function () {
      Auth.logout();
    };

  }
])
.controller('SignupController', ['$rootScope', '$scope', '$location', 'Auth', 'SignupSuccess', 'SignupFailure', function($rootScope, $scope, $location, Auth, SignupSuccess, SignupFailure) {

	$scope.newUser = {
    username: '',
    email: '',
    password: '',
    confirmpassword: ''
  };

  $scope.signup = function (newUser) {

    Auth.signup(newUser, 
    function(res){
    	SignupSuccess(res.message).then(function(){
    		$scope.newUser = {
		      username: '',
		      email: '',
		      password: '',
		      confirmpassword: ''
		    };
    		$location.path('/login');
    	});
    }, 
    function (err) {
    	var errorMessage = '';
    	if (typeof err.message != 'string') {
    		errorMessage += '<p>Sorry, something while creating your account:</p><ul>';
    		for (index in err.message) {
	    		errorMessage += '<li>' + err.message[index].message + '</li>';
	    	}	
	    	errorMessage += '</ul>';
    	} else {
    		errorMessage = err.message;
    	}
      SignupFailure(errorMessage).then(function(){
    		$location.path('/signup');
    	});
    });
  };
}])