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

var upsert = function (arr, key, newval) {
    var match = _.find(arr, key);
    if(match){
        var index = _.indexOf(arr, _.find(arr, key));
        arr.splice(index, 1, newval);
    } else {
        arr.push(newval);
    }
};

/**
 * @param {function} a The function to execute when the DOM is ready
 *
 * Source: https://gist.github.com/dciccale/4087856
 */

var DOMReady = function(a,b,c){b=document,c='addEventListener';b[c]?b[c]('DOMContentLoaded',a):window.attachEvent('onload',a)}

DOMReady(function () {
  //Test support for -webkit-background-clip:text;
	if(document.body.style.webkitBackgroundClip !== undefined){
		document.documentElement.className += ' backgroundclip';
	}
});

/**
 * Bootstrap application and define routes
 *
 */

angular.module('coloriApp', ['ngFileUpload', 'ngAnimate', 'ngMaterial', 'angularMoment', 'ngStorage', 'ui.router', 'angular-jwt', 'colorpicker.module', 'draggableModule', 'coloriAppAuthorization', 'coloriAppUsers', 'coloriAppGradients', 'coloriAppAnimator', 'coloriAppComments'])
  .constant('urls', {
    BASE: '/api'
  })
  .factory('TokenExpiredMessage', ['$mdDialog', function($mdDialog){

    return function(message) {

      var alert = $mdDialog.alert()
        .title('Your session has expired.')
        .content(message)
        .ok('Close');
        return $mdDialog.show(alert);

    }

  }])
  .factory('tokenExpirationFactory', ['$rootScope', 'Auth', 'jwtHelper', '$location', 'ToastFactory', function($rootScope, Auth, jwtHelper, $location, ToastFactory){
    return {
      check: function() {
        var token = Auth.getToken();
        if (token != undefined && jwtHelper.isTokenExpired(token)) {
          $rootScope.currentUser = null;
          Auth.deleteToken();
          ToastFactory('Your current user session has expired. Please log back in to proceed.', 4500, 'warn').then(function(){
            console.warn('Your current user session has expired. Please log back in to proceed.');
          });
        }
      }
    }
  }])
  .config(['$provide', '$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', 'jwtInterceptorProvider', 
    function($provide, $stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, jwtInterceptorProvider) {

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
      state('user', {
        url: '/users/:username',
        templateUrl: '/partials/user.html',
        controller: 'UserController'
      }).
      state('confirm-email', {
        url: '/confirm-email/:email_verification_uuid',
        controller: 'ConfirmEmailController'
      });

    $locationProvider.html5Mode(true);

  }])
  .run(['$rootScope', 'colorStopRegister', 'tokenExpirationFactory', 
    function($rootScope, colorStopRegister, tokenExpirationFactory){
    $rootScope.$on('$stateChangeStart',
      function(event, toState, toParams, fromState, fromParams){
        tokenExpirationFactory.check();
        

        if (toState.url == '/gradients/:permalink' || toState.url == '/editor') {
          colorStopRegister.setColorStops([]);
        }
    });
}])