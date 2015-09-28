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
					console.log(res.data);
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
			heartGradient: function(permalink, success, error){
				$http.post(urls.BASE + '/gradients/' + permalink + '/heart').then(function(res){
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
		var angle = 0;
		return {
			increasePickerCount: function() {
				pickerCount++;
			},
			getPickerCount: function() {
				return pickerCount;
			},
			setPickerCount: function(num) {
				pickerCount = num;
			},
			pushColorStop: function(el) {
				var newColorStop = {
					id: pickerCount,
					left: ((el.prop('offsetLeft') + (el.prop('clientWidth')/2)) / window.innerWidth * 100).toPrecision(5),
	        color: ( Object.size(colorStops) > 1 ) ? colorStops.colorStop0.color : 'white'
				};

				colorStops['colorStop' + pickerCount] = newColorStop;
				
				pickerCount++;
			},
			pushExistingColorStop: function(colorStop, colorStopsNum) {
				var newColorStop = {
					id: colorStop.id,
					left: colorStop.left,
	        color: colorStop.color
				};
				
				colorStops['colorStop' + newColorStop.id] = newColorStop;
				
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
				return result;
			},
			getAngle: function() {
				return angle;
			},
			setAngle: function(newAngle) {
				angle = newAngle;
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
  .filter('cssFormatFilter', function() {
	  return function(input) {
	    input = input || '';
	    var out = input.split('\t').join('\t');
	    out = out.replace(/\s\s+/g, '\n\t');
	    out = out.split(';').join(';\n\n');
	    out = out.split(', ').join(',\n\t');
	    out = out.split('gradient(\n\t').join('gradient(');
	    out = out.split('gradient(').join('gradient(\n\t');
	    out = out.split(':').join(':\n\t');

	    return out;
	  };
	})
	.factory('CommentSaveFailed', ['$mdDialog', function($mdDialog){

    return function(message) {

      var alert = $mdDialog.alert()
        .title('Couldn\'t save this comment!')
        .content(message)
        .ok('Close');
        return $mdDialog.show(alert);

    }

  }])
  .directive('cssGradientString',  ['animator', function(animator) {
		return {
			restrict: 'E',
			scope: {
				cssgradientstring: '=',
				cssgradientstringautoprefixed: '=',
				showcss: '='
			},
			templateUrl: '/partials/directives/css-gradient-string.html',
			link: function(scope, element, attributes) {
				scope.closeCss = function() {

					scope.showcss = false;
				}
			}
		}
	}])
	.controller('gradientController', ['$scope', '$compile', '$location', 'colorStopRegister', 'gradientService', '$stateParams', 'GradientSaveFailed', 'ToastFactory', 
		function($scope, $compile, $location, colorStopRegister, gradientService, $stateParams, GradientSaveFailed, ToastFactory) {

		function flattenCommentsObject(commentsInput) {
			//Reprocess into flat array for sorting.
			if (Array.isArray(commentsInput)) {
				for(var i = 0; i < commentsInput.length; i++) {
					var commentTemp = {
						body: commentsInput[i].body,
						createdAt: commentsInput[i].createdAt,
						author: commentsInput[i].User.username,
						authoravatar: commentsInput[i].User.UserProfile.avatar_url
					}
					$scope.comments.push(commentTemp);
					upsert($scope.gradient.Comments, {id: commentsInput[i].id}, commentsInput[i]);
				}
			} else {
				var commentTemp = {
					body: commentsInput.body,
					createdAt: commentsInput.createdAt,
					author: commentsInput.User.username,
					authoravatar: commentsInput.User.UserProfile.avatar_url
				}
				$scope.comments.push(commentTemp);
				upsert($scope.gradient.Comments, {id: commentsInput.id}, commentsInput);
			}
		}

		$scope.gradient = {};

		$scope.dialAngle = colorStopRegister.getAngle();

		$scope.$watch(function(scope){
			return colorStopRegister.getAngle();
		}, function(newValue, oldValue){
			colorStopRegister.setAngle(newValue);
			$scope.dialAngle = colorStopRegister.getAngle();
		});

		$scope.init = function() {
			// If browsing to a predefined gradient, display it on screen
			if (typeof $stateParams.permalink != 'undefined') {
				gradientService.getGradient($stateParams.permalink,
					function(res){
						$scope.gradient = res.gradientFound;
						
						$scope.comments = [];

						flattenCommentsObject(res.gradientFound.Comments);						

						addExistingColorPickers(res.gradientFound.color_stops, res.gradientFound.angle);

						$scope.colorStops = colorStopRegister.getColorStops();

						colorStopRegister.setAngle(res.gradientFound.angle);

						$scope.dialAngle = res.gradientFound.angle;
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

		$scope.closeCss = function() {
			$scope.showCss = false;
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
					$scope.newComment = {
					 	body: ''
					 };
					flattenCommentsObject(res.commentCreated);
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
				result += 'linear-gradient(\n\t   ' + $scope.dialAngle + 'deg,';
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

		//Keep an eye on our gradient service to see if our view
		//should be updated with new color stops.
		$scope.$watch(function(scope){
				return getGradientCssString();
			},
			function(newValue, oldValue){
				$scope.gradientCssString = getGradientCssString();
			});

		$scope.addHeart = function(permalink){
			gradientService.heartGradient(permalink,
				function(res){
					$scope.gradient = res.gradientFound;
				}, function(err){
					console.log(err);
				});
		};

		$scope.saveGradient = function(){
			var newGradient = {
				title: 'Untitled Gradient',
				body: getGradientCssString(),
				description: 'This is a test gradient.',
				color_stops: sortColorStopsByPositionLeft(colorStopRegister.getColorStops()),
				angle: $scope.dialAngle
			}
			gradientService.createGradient(newGradient,
				function(res){
					console.log(res);
					$location.path('/gradients/' + res.gradientCreated.permalink);
					ToastFactory('Gradient successfully saved.', 3000, 'success').then(function(){
            console.info('Gradient successfully saved.');
          }); 
				}, function(err){
					GradientSaveFailed(err.message).then(function(){
						console.log(err);
					});
				});
		}

		$scope.addColorPicker = function() {
			colorStopRegister.setAngle($scope.dialAngle);
			var gradCount = colorStopRegister.getPickerCount();
			var el = $compile('<div class="colorpicker__wrapper" draggable gradient-id="' + gradCount + '"><button class="colorpicker__button" style="border:3px solid {{colorStops.colorStop' + gradCount + '.color}};" colorpicker="rgba" colorpicker-position="custom" colorpicker-with-input="true" ng-model="colorStops.colorStop' + gradCount + '.color"><div class="colorpicker__button-position-arrow" style="border-top:10px solid {{colorStops.colorStop' + gradCount + '.color}};"></div></button></div>')($scope);
			var elDest = document.querySelector('.gradient-wrapper');
			angular.element(elDest).append(el);
			el.css({
				left: ((window.innerWidth/2) - (el[0].clientWidth/2)).toPrecision(7) + 'px'
			});					
			colorStopRegister.pushColorStop(el);
			$scope.dialAngle = colorStopRegister.getAngle();
		};

		addExistingColorPickers = function(colorPickers, angle) {
			if (colorStopRegister.getPickerCount() == colorPickers.length) {
				return;
			}
			var elDest = document.querySelector('.gradient-wrapper');
			var colorPickersElement = ''; 

			for(var i = 0; i < colorPickers.length; i++){
				var colorPicker = colorPickers[i];
				//Offset the left position of each rehydrated colorpicker to account for its width.
				var offsetAmount = (15/window.innerWidth) * 100;
				var el = '<div style="position:absolute;left:' + (colorPicker.left-offsetAmount) + '%" class="colorpicker__wrapper" draggable gradient-id="' + colorPicker.id + '"><button class="colorpicker__button" style="border:3px solid {{colorStops.colorStop' + colorPicker.id + '.color}};" colorpicker="rgba" colorpicker-position="custom" colorpicker-with-input="true" ng-model="colorStops.colorStop' + colorPicker.id + '.color"><div class="colorpicker__button-position-arrow" style="border-top:10px solid {{colorStops.colorStop' + colorPicker.id + '.color}};"></div></button></div>';
				colorPickersElement +=  el;
				colorStopRegister.pushExistingColorStop(colorPicker, colorPickers.length);	
			}

			if (colorStopRegister.getPickerCount() == colorPickers.length) {
				$scope.colorStops = colorStopRegister.getRawColorStops();
				angular.element(elDest).append($compile(colorPickersElement)($scope));
				colorStopRegister.setPickerCount(colorPickers.length);
				colorStopRegister.setAngle(angle);
				$scope.dialAngle = angle;
			}
		};

		$scope.init();

	}])
	.controller('gradientGridController', ['$scope', '$rootScope', 'gradientService', function($scope, $rootScope, gradientService) {

		$scope.gradientItems = [];

		$scope.init = function() {
			gradientService.getGradients(function(res){
				console.log(res.gradientsFound);
				$scope.gradientItems = res.gradientsFound;
			}, function(err){
				console.log(err);
			});
		};

		$scope.sortOrder = '';
		
		$scope.init();

	}])
	.directive('addGradientPicker', [function(){
		return {
			restrict: 'E',
			template: '<button type="button" ng-click="addColorPicker()"><svg style="fill:{{sortedColorStops[0].color || \'white\'}};" class="icon" viewBox="0 0 600 600"><use xlink:href="#eyedropper_45_add" /></svg></button>'
		};
	}])
.directive('gradientItem', ['animator', 'gradientService', function(animator, gradientService) {
	return {
		restrict: 'E',
		scope: {
			gradienttitle: '=',
			author: '=',
			authoravatar: '=',
			views: '=',
			hearts: '=',
			comments: '=',
			gradient: '=',
			permalink: '=',
			posted: '=',
			allgradients: '='
		},
		templateUrl: '/partials/directives/gradient-item.html',
		link: function(scope, element, attributes) {
			element[0].querySelector('.gradientItem').style.opacity = 0;
			
			animator.fadeInUp(element[0].querySelector('.gradientItem'), scope.$parent.$index);

			scope.addHeart = function(permalink){
				gradientService.heartGradient(permalink,
					function(res){
						upsert(scope.allgradients, {'id': res.gradientFound.id}, res.gradientFound);
					}, function(err){
						console.log(err);
					});
			};
		}
	}
}])
.directive('dial', ['$document', '$window', '$timeout', function($document, $window, $timeout) {
  return {
    restrict: 'E',
    scope: {
      angle: '='
    },
    link: function(scope, element, attrs) {
      var startAngle = scope.angle,
          w = 200,
          h = 200,
          x = (parseInt($window.innerWidth) / 2) - (w / 2), 
          y = (parseInt($window.innerHeight) / 2) - (h / 2);

      element.css({
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translateX(-50%) translateY(-50%) rotateZ(' + startAngle + 'deg)',
        borderRadius: '50%',
        cursor: 'pointer',
        display: 'block',
        width: w + 'px',
        height: h + 'px'
      });

      scope.$watch('angle', function(newValue, oldValue){
        updateAngle(newValue - startAngle);
      });

      element.on('mousedown', function(event) {
        // Prevent default dragging of selected content
        event.preventDefault();
        $document.on('mousemove', mousemove);
        $document.on('mouseup', mouseup);
      });

      function mousemove(event) {
        y = event.clientY;
        x = event.clientX;
        ctrX = $window.innerWidth / 2;
        ctrY = $window.innerHeight / 2;
        angle = Math.atan2(-(ctrY - y), -(ctrX - x)) * 180 / Math.PI + 180;

        scope.$apply(function(){
          scope.angle = angle + startAngle - 180;
        });
        
        updateAngle(angle);
      }

      function mouseup() {
        $document.off('mousemove', mousemove);
        $document.off('mouseup', mouseup);
      }

      function updateAngle(angle) {        
        element.css({
          transform: 'translateX(-50%) translateY(-50%) rotateZ(' + (angle - 180 + startAngle) + 'deg)'
        });
      }
    }
  }
}])