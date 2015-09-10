/*
 *	GLOBAL UTILITIES
 *
 */

Object.size = function(obj) {
  var size = 0, key;
  for (key in obj) {
      if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};

function bySortedLeftValue(obj, callback, context) {
    var tuples = [];

    for (var key in obj) tuples.push([key, obj[key]]);

    tuples.sort(function(a, b) { return parseFloat(a[1].left) < parseFloat(b[1].left) ? 1 : parseFloat(a[1].left) > parseFloat(b[1].left) ? -1 : 0 });

    var length = tuples.length;
    while (length--) callback.call(context, tuples[length][0], tuples[length][1]);
}

angular.module('coloriApp', ['ngStorage', 'ui.router', 'angular-jwt', 'colorpicker.module', 'draggableModule'])
	.constant('urls', {
	  BASE: 'http://localhost:8080/api'
	})
	.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', 'jwtInterceptorProvider', 
		function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, jwtInterceptorProvider) {

		jwtInterceptorProvider.tokenGetter = ['$localStorage', 'Auth', function($localStorage, Auth) {
	    return Auth.getToken();
	  }];

	  $httpProvider.interceptors.push('jwtInterceptor');

	  $urlRouterProvider.otherwise("/");

	  $stateProvider.
	  	state('home', {
	  		url: '/',
	  		templateUrl: '/partials/gradients.html',
	  		controller: 'gradientGridController'
	  	}).
	  	state('editor', {
	  		url: '/editor',
	  		templateUrl: '/partials/editor.html',
				controller: 'gradientController'
	  	}).
	    state('login', {
	      url: '/login',
	      templateUrl: '/partials/login.html',
	      controller: 'MainController'
	    }).
	    state('signup', {
	      url: '/signup',
	      templateUrl: '/partials/signup.html',
	      controller: 'SignupController'
	    }).
	    state('users', {
	      url: '/users',
	      templateUrl: '/partials/users.html',
	      controller: 'UsersController'
	    }).
	    state('users.detail', {
	      url: '/:username',
	      templateUrl: '/partials/users.detail.html',
	      controller: 'UserController'
	    });

	   $locationProvider.html5Mode(true);

	}])
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
	      $rootScope.message = res.message;
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
	.service('gradientRegister', function() {
		var pickerCount = 0;
		var gradients = [];
		return {
			increasePickerCount: function() {
				pickerCount++;
			},
			getPickerCount: function() {
				return pickerCount;
			},
			pushGradient: function(el) {
				var newGradient = {
					id: pickerCount,
					left: ((el.prop('offsetLeft') + (el.prop('clientWidth')/2)) / window.innerWidth * 100).toPrecision(5),
	        color: ( Object.size(gradients) > 1 ) ? gradients.gradient0.color : 'white'
				};
				gradients['gradient' + pickerCount] = newGradient;
				//console.log(newGradient);
				pickerCount++;
			},
			setGradientLeft: function(gradientId, leftAmount) {
				gradients['gradient' + gradientId].left = leftAmount;
			},
			getGradients: function() {
				return gradients;
			}
		};
		
	})
	.controller('gradientController', ['$scope', 'gradientRegister', function($scope, gradientRegister) {
		
		$scope.gradients = gradientRegister.getGradients();

		$scope.pushGradient = function() {
			gradientRegister.pushGradient();
		};

		$scope.showCss = false;

		$scope.toggleCss = function() {
			$scope.showCss = !$scope.showCss;
		};

		$scope.increasePickerCount = gradientRegister.increasePickerCount;

		getGradientCssString = function() {
			var result = 'background:';
			
			var gradients = gradientRegister.getGradients();

			var sortedGradients = [];

			//Sort gradient stops by how far left they are. Allows
			//gradient stops to be ordered and still produce a
			//consistent result.
			bySortedLeftValue(gradients, function(key, value) {
				sortedGradients.push(value);
			});

			gradients = sortedGradients;

			//If we have liear gradient stops in our service, 
			//build a css string for our inline style block.
			if (gradients.length > 1) {
				var counter = 0;
				result += 'linear-gradient(\n\t   to right,';
				for(var i = 0; i < gradients.length; i++) {
					result += '\n\t   ' + gradients[i].color + ' ' + parseFloat(gradients[i].left).toPrecision(5) + '%';
					if (i + 1 !== gradients.length) {
						result += ",";
					}
				}
				result += ");";
			//If there's only one gradient color stop on screen,
			//give it a default color of white to start with.
			}	else if (gradients.length == 1) {
				result += (gradients[0]) ? gradients[0].color : 'white';
				result += ';';
			//On initialization of the view, use a pretty default
			//linear gradient seen here.
			}	else if (gradients.length < 1) {
				result += 'linear-gradient(\n\t   to right, \n\t   rgba(0,133,255,1) 0%, \n\t   rgba(0,209,255,1) 50%, \n\t   rgba(0,255,178,1) 100%);';
			}
			
			return result;	
		}

		$scope.gradientCssString = getGradientCssString();

		//Keep an eye on our gradient service to see if our view
		//should be updated with new color stops.
		$scope.$watch(function(scope){
				return getGradientCssString();
			},
			function(newValue, oldValue){
				$scope.gradientCssString = getGradientCssString();			
			});

	}])
	.controller('gradientGridController', ['$scope', function($scope) {

		$scope.gradientItems = [{
			author: 'sprinkles',
			views: 14,
			hearts: 237,
			comments:16,
			gradient: 'background-image:linear-gradient(to right, rgba(0,133,255,1) 0%, rgba(0,209,255,1) 50%, rgba(0,255,178,1) 100%);'
		},{
			author: 'Kefo23',
			views: 289,
			hearts: 12,
			comments:36,
			gradient: 'background-image:linear-gradient(to right, rgba(171,64,209,1) 3.2986%, rgba(144,91,214,1) 50.000%, rgba(64,87,209,1) 94.826%);'
		},{
			author: 'arrMarquez',
			views: 53,
			hearts: 48,
			comments:3,
			gradient: 'background-image:linear-gradient(to right, rgba(119,209,64,1) 3.2986%, rgba(197,214,91,1) 50.000%, rgba(209,134,64,1) 94.826%);'
		},{
			author: 'Ribbin',
			views: 6,
			hearts: 12,
			comments:36,
			gradient: 'background-image:linear-gradient(to right, rgba(64,209,70,1) 3.2986%, rgba(91,214,177,1) 32.535%, rgba(64,200,209,1) 62.188%, rgba(64,122,209,1) 100.45%);'
		},{
			author: 'JMT Group',
			views: 47,
			hearts: 2,
			comments:0,
			gradient: 'background-image:linear-gradient(to right, rgba(50,66,145,1) 1.1458%, rgba(50,145,99,1) 50.000%, rgba(52,145,50,1) 99.549%);'
		},{
			author: 'looloo',
			views: 158,
			hearts: 27,
			comments:1,
			gradient: 'background-image:linear-gradient(to right,rgba(245,255,218,1) 1.9792%,rgba(218,248,255,1) 50.000%,rgba(255,220,218,1) 98.993%);'
		}]

		$scope.init = function() {
			
		}

		$scope.sortOrder = '-hearts';

		$scope.init();

	}])
	.directive('addGradientPicker', ['$compile', 'gradientRegister', function($compile, gradientRegister){
		return {
			restrict: 'E',
			template: '<button type="button" ng-click="addGradientPicker()"><svg class="icon" viewBox="0 0 600 600"><use xlink:href="#eyedropper_45_add" /></svg></button>',
			controller: function($scope, $element, $attrs) {
				$scope.addGradientPicker = function() {
					var gradCount = gradientRegister.getPickerCount();
					var el = $compile('<div class="colorpicker__wrapper" draggable gradient-id="' + gradCount + '"><button class="colorpicker__button" style="border:3px solid {{gradients.gradient' + gradCount + '.color}};" colorpicker="rgba" colorpicker-position="custom" colorpicker-with-input="true" ng-model="gradients.gradient' + gradCount + '.color">' + (gradCount + 1) + '<div class="colorpicker__button-position-arrow" style="border-top:10px solid {{gradients.gradient' + gradCount + '.color}};"></div></button></div>')($scope);
					var elDest = document.querySelector('.gradient-wrapper');
					angular.element(elDest).append(el);
					el.css({
						left: ((window.innerWidth/2) - (el[0].clientWidth/2)).toPrecision(7) + 'px'
					});					
					gradientRegister.pushGradient(el);
				};
			}
		};
	}])
.directive('gradientItem', [function() {
	return {
		restrict: 'E',
		scope: {
			author: '=',
			views: '=',
			hearts: '=',
			comments: '=',
			gradient: '='
		},
		templateUrl: '/partials/directives/gradient-item.html',
		link: function(scope, element, attributes) {

		}
	}
}])
.controller('MainController', ['$rootScope', '$scope', '$location', '$localStorage', 'Auth', 
  function MainController($rootScope, $scope, $location, $localStorage, Auth) {

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
    }, function(res) {
      $rootScope.message = res.message;
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