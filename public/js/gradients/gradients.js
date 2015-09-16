angular.module('coloriAppGradients', [])
.factory('gradientService', ['$http', 'urls', function($http, urls){
		var gradientCache = [];
		return {
			getGradients: function(success, error){
				$http.get(urls.BASE + '/gradients').then(function(res){
					success(res.data);
				}, function(err){
					error(err.data);
				});
			},
			getGradientsByUsername: function(username, success, error){
				$http.get(urls.BASE + '/gradients/by/' + username).then(function(res){
					success(res.data);
				}, function(err){
					error(err.data);
				});
			},
			getGradient: function(permalink, success, error){
				if (gradientCache[permalink]) {
					success(gradientCache[permalink]);
				} else {
					$http.get(urls.BASE + '/gradients/' + permalink).then(function(res){
						gradientCache[permalink] = res.data;
						success(res.data);
					}, function(err) {
						error(err.data);
					});	
				}
			},
			createGradient: function(gradient, success, error){
				$http.post(urls.BASE + '/gradients', gradient).then(function(res){
					success(res.data);
				}, function(err){
					error(err.data);
				});
			},
			postComment: function(permalink, comment, success, error){
				$http.post(urls.BASE + '/gradients/' + permalink + '/comment', comment).then(function(res){
					success(res.data);
				}, function(err){
					error(err.data);
				});
			}
		}
	}])
	.service('colorStopRegister', [function() {
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
				var newColorStop = {
					id: pickerCount,
					left: ((el.prop('offsetLeft') + (el.prop('clientWidth')/2)) / window.innerWidth * 100).toPrecision(5),
	        color: ( Object.size(colorStops) > 1 ) ? colorStops.colorStop0.color : 'white'
				};
				
				colorStops['colorStop' + pickerCount] = newColorStop;
				
				console.log(colorStops);
				pickerCount++;
			},
			pushExistingColorStop: function(colorStop) {
				var newColorStop = {
					id: pickerCount,
					left: colorStop.left,
	        color: colorStop.color
				};
				
				colorStops['colorStop' + pickerCount] = newColorStop;
				
				console.log(colorStops);
				pickerCount++;
			},
			setGradientLeft: function(colorStopId, leftAmount) {
				colorStops['colorStop' + colorStopId].left = leftAmount;
			},
			setColorStops: function(newColorStops) {
				colorStops = newColorStops;
				if (!newColorStops.length) {
					pickerCount = 0;
				}
			},
			getColorStops: function() {
				return colorStops;
			},
			getRawColorStops: function() {
				var result = [];
				for (var key in colorStops) {
					result.push(colorStops[key])
				}
				console.log(result);
				return result;
			}
		};
		
	}])
	.factory('GradientSaveFailed', ['$mdDialog', function($mdDialog){

    return function(message) {

      var alert = $mdDialog.alert()
        .title('Couldn\'t save this gradient!')
        .content(message)
        .ok('Close');
        return $mdDialog.show(alert);

    }

  }])
	.factory('CommentSaveFailed', ['$mdDialog', function($mdDialog){

    return function(message) {

      var alert = $mdDialog.alert()
        .title('Couldn\'t save this comment!')
        .content(message)
        .ok('Close');
        return $mdDialog.show(alert);

    }

  }])
	.controller('gradientController', ['$timeout', '$scope', '$compile', 'colorStopRegister', 'gradientService', '$stateParams', 'GradientSaveFailed', function($timeout, $scope, $compile, colorStopRegister, gradientService, $stateParams, GradientSaveFailed) {

		$scope.gradient = {};

		$scope.init = function() {
			// If browsing to a predefined gradient, display it on screen
			if (typeof $stateParams.permalink != 'undefined') {
				gradientService.getGradient($stateParams.permalink,
					function(res){
						$scope.gradient = res.gradientFound;
						addExistingColorPickers(res.gradientFound.color_stops);
					}, function(err){
						console.log(err);
					});
			
			} else {
			// If not displaying a predefined a gradient, display a blank canvas
				$scope.colorStops = colorStopRegister.getColorStops();	
			}
		}

		/*
		 *	UI States
		 *
		 */

		$scope.showSocial = false;
		$scope.showCss = false;

		$scope.toggleCss = function() {
			$scope.showCss = !$scope.showCss;
		};

		$scope.toggleSocialPanel = function() {
			$scope.showSocial = !$scope.showSocial;
		}

		/*
		 *	Comments
		 *
		 */

		$scope.newComment = {
		 	body: ''
		};

		$scope.postComment = function(newComment){
			gradientService.postComment(
				$stateParams.permalink,
				newComment,
				function(res){
					console.log(res);
					$scope.newComment = {
					 	body: ''
					 };
					$scope.gradient.Comments.push(res.commentCreated);
				}, function(err){
					CommentSaveFailed(err.message).then(function(){
						console.log(err);
					});
				});
		}

		/*
		 *	ColorStop Management
		 *
		 */

		$scope.pushColorStop = function() {
			colorStopRegister.pushColorStop();
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
			$scope.sortedColorStops = colorStops;

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

		$scope.getGradientCssString = getGradientCssString;
		$scope.gradientCssString = getGradientCssString();
		$scope.colorStops = colorStopRegister.getRawColorStops();

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
					GradientSaveFailed(err.message).then(function(){
						console.log(err);
					});
				});
		}

		$scope.addColorPicker = function() {
			var gradCount = colorStopRegister.getPickerCount();
			var el = $compile('<div class="colorpicker__wrapper" draggable gradient-id="' + gradCount + '"><button class="colorpicker__button" style="border:3px solid {{colorStops.colorStop' + gradCount + '.color}};" colorpicker="rgba" colorpicker-position="custom" colorpicker-with-input="true" ng-model="colorStops.colorStop' + gradCount + '.color"><div class="colorpicker__button-position-arrow" style="border-top:10px solid {{colorStops.colorStop' + gradCount + '.color}};"></div></button></div>')($scope);
			var elDest = document.querySelector('.gradient-wrapper');
			angular.element(elDest).append(el);
			el.css({
				left: ((window.innerWidth/2) - (el[0].clientWidth/2)).toPrecision(7) + 'px'
			});					
			colorStopRegister.pushColorStop(el);
		};

		addExistingColorPickers = function(colorPickers) {
			var elDest = document.querySelector('.gradient-wrapper');
			var colorPickersElement = ''; 

			for(var i = 0; i < colorPickers.length; i++){
				var colorPicker = colorPickers[i];
				var gradCount = colorStopRegister.getPickerCount();
				var el = '<div style="position:absolute;left:' + colorPicker.left + '%" class="colorpicker__wrapper" draggable gradient-id="' + colorPicker.id + '"><button class="colorpicker__button" style="border:3px solid colorStops.colorStop.' + colorPicker.id + '.color}};" colorpicker="rgba" colorpicker-position="custom" colorpicker-with-input="true" ng-model="colorStops.colorStop' + colorPicker.id + '.color"><div class="colorpicker__button-position-arrow" style="border-top:10px solid {{colorStops.colorStop' + colorPicker.id + '.color}};"></div></button></div>';
				colorPickersElement +=  el;
				colorStopRegister.pushExistingColorStop(colorPicker);
			}
			if (colorStopRegister.getPickerCount() == colorPickers.length) {
				angular.element(elDest).append($compile(colorPickersElement)($scope));	
			}
		};

		$scope.init();

	}])
	.controller('gradientGridController', ['$scope', '$rootScope', 'gradientService', function($scope, $rootScope, gradientService) {

		$scope.gradientItems = [];

		$scope.init = function() {
			gradientService.getGradients(function(res){
				$scope.gradientItems = res.gradientsFound;
			}, function(err){
				console.log(err);
			});
		}

		$scope.sortOrder = '';

		$scope.init();

	}])
	.directive('addGradientPicker', [function(){
		return {
			restrict: 'E',
			template: '<button type="button" ng-click="addColorPicker()"><svg style="fill:{{sortedColorStops[0].color || \'white\'}};" class="icon" viewBox="0 0 600 600"><use xlink:href="#eyedropper_45_add" /></svg></button>'
		};
	}])
.directive('gradientItem', [function() {
	return {
		restrict: 'E',
		scope: {
			title: '=',
			author: '=',
			authoravatar: '=',
			views: '=',
			hearts: '=',
			comments: '=',
			gradient: '=',
			permalink: '=',
			posted: '='
		},
		templateUrl: '/partials/directives/gradient-item.html',
		link: function(scope, element, attributes) {

		}
	}
}])