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
	  	state('gradient', {
	  		url: '/gradients/:permalink',
	  		templateUrl: '/partials/editor.html',
	  		controller: 'gradientController'
	  	}).
	    state('login', {
	      url: '/login',
	      templateUrl: '/partials/login.html',
	      controller: 'LoginController'
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
	.factory('gradientService', ['$http', 'urls', function($http, urls){
		return {
			getGradients: function(success, error){
				$http.get(urls.BASE + '/gradients').then(function(res){
					success(res.data);
				}, function(err){
					error(err.data);
				});
			},
			getGradient: function(permalink, success, error){
				$http.get(urls.BASE + '/gradients/' + permalink).then(function(res){
					success(res.data);
				}, function(err) {
					error(err.data);
				});
			},
			createGradient: function(gradient, success, error){
				$http.post(urls.BASE + '/gradients', gradient).then(function(res){
					success(res.data);
				}, function(err){
					error(err.data);
				});
			}
		}
	}])
	.service('colorStopRegister', function() {
		var pickerCount = 0;
		var colorStops = [];
		return {
			increasePickerCount: function() {
				pickerCount++;
			},
			getPickerCount: function() {
				return pickerCount;
			},
			pushColorStop: function(el) {
				var newGradient = {
					id: pickerCount,
					left: ((el.prop('offsetLeft') + (el.prop('clientWidth')/2)) / window.innerWidth * 100).toPrecision(5),
	        color: ( Object.size(colorStops) > 1 ) ? colorStops.gradient0.color : 'white'
				};
				colorStops['gradient' + pickerCount] = newGradient;
				//console.log(newGradient);
				pickerCount++;
			},
			setGradientLeft: function(gradientId, leftAmount) {
				colorStops['gradient' + gradientId].left = leftAmount;
			},
			setColorStops: function(newColorStops) {
				colorStops = newColorStops;
			},
			getColorStops: function() {
				return colorStops;
			}
		};
		
	})
	.controller('gradientController', ['$scope', '$compile', 'colorStopRegister', 'gradientService', '$stateParams', function($scope, $compile, colorStopRegister, gradientService, $stateParams) {

		$scope.init = function() {
			// If browsing to a predefined gradient, display it on screen
			if (typeof $stateParams.permalink != 'undefined') {
				gradientService.getGradient($stateParams.permalink,
					function(res){
						console.log(res);
						colorStopRegister.setColorStops(res.gradientFound.color_stops);
						$scope.colorStops = res.gradientFound.color_stops;
						$scope.injectColorPicker(res.gradientFound.color_stops[0]);
					}, function(err){
						console.log(err);
					});
			
			} else {
			// If not displaying a predefined a gradient, display a blank canvas
				$scope.colorStops = colorStopRegister.getColorStops();	
			}
		}

		$scope.pushColorStop = function() {
			colorStopRegister.pushColorStop();
		};

		$scope.showCss = false;

		$scope.toggleCss = function() {
			$scope.showCss = !$scope.showCss;
		};

		$scope.increasePickerCount = colorStopRegister.increasePickerCount;

		var sortColorStopsByPositionLeft = function(colorStops) {
			var sortedColorStops = [];

			//Sort gradient stops by how far left they are. Allows
			//gradient stops to be ordered and still produce a
			//consistent result.
			bySortedLeftValue(colorStops, function(key, value) {
				sortedColorStops.push(value);
			});

			return sortedColorStops;
		}

		var getGradientCssString = function() {
			var colorStops = sortColorStopsByPositionLeft(colorStopRegister.getColorStops());

			var result = 'background:';

			//If we have liear gradient stops in our service, 
			//build a css string for our inline style block.
			if (colorStops.length > 1) {
				var counter = 0;
				result += 'linear-gradient(\n\t   to right,';
				for(var i = 0; i < colorStops.length; i++) {
					result += '\n\t   ' + colorStops[i].color + ' ' + parseFloat(colorStops[i].left).toPrecision(5) + '%';
					if (i + 1 !== colorStops.length) {
						result += ",";
					}
				}
				result += ");";
			//If there's only one gradient color stop on screen,
			//give it a default color of white to start with.
			}	else if (colorStops.length == 1) {
				result += (colorStops[0]) ? colorStops[0].color : 'white';
				result += ';';
			//On initialization of the view, use a pretty default
			//linear gradient seen here.
			}	else if (colorStops.length < 1) {
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

		$scope.saveGradient = function(){
			var newGradient = {
				title: 'New Gradient',
				body: getGradientCssString(),
				description: 'This is a test gradient.',
				color_stops: sortColorStopsByPositionLeft(colorStopRegister.getColorStops())
			}
			gradientService.createGradient(newGradient,
				function(res){
					console.log(res);
				}, function(err){
					console.log(err);
				});
		}

		$scope.init();

	}])
	.controller('gradientGridController', ['$scope', '$rootScope', 'gradientService', function($scope, $rootScope, gradientService) {

		$scope.gradientItems = [];

		$scope.init = function() {
			gradientService.getGradients(function(res){
				console.log(res);
				$scope.gradientItems = res.gradientsFound;
			}, function(err){
				console.log(err);
				$rootScope.message = err.message;
			});
		}

		$scope.sortOrder = '-hearts';

		$scope.init();

	}])
	.directive('addGradientPicker', ['$compile', 'colorStopRegister', function($compile, colorStopRegister){
		return {
			restrict: 'E',
			template: '<button type="button" ng-click="addGradientPicker()"><svg class="icon" viewBox="0 0 600 600"><use xlink:href="#eyedropper_45_add" /></svg></button>',
			controller: function($scope, $element, $attrs) {

				$scope.addGradientPicker = function() {
					var gradCount = colorStopRegister.getPickerCount();
					var el = $compile('<div class="colorpicker__wrapper" draggable gradient-id="' + gradCount + '"><button class="colorpicker__button" style="border:3px solid {{colorStops.gradient' + gradCount + '.color}};" colorpicker="rgba" colorpicker-position="custom" colorpicker-with-input="true" ng-model="colorStops.gradient' + gradCount + '.color">' + (gradCount + 1) + '<div class="colorpicker__button-position-arrow" style="border-top:10px solid {{colorStops.gradient' + gradCount + '.color}};"></div></button></div>')($scope);
					var elDest = document.querySelector('.gradient-wrapper');
					angular.element(elDest).append(el);
					el.css({
						left: ((window.innerWidth/2) - (el[0].clientWidth/2)).toPrecision(7) + 'px'
					});					
					colorStopRegister.pushColorStop(el);
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
			gradient: '=',
			permalink: '='
		},
		templateUrl: '/partials/directives/gradient-item.html',
		link: function(scope, element, attributes) {

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