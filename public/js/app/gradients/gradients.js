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
		var sortedColorStops = [];
		var originalColorStops = [];
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
			getColorStops: function() {
				return colorStops;
			},
			setColorStops: function(newColorStops) {
				colorStops = newColorStops;
				if (!newColorStops.length) {
					pickerCount = 0;
				}
			},
			getSortedColorStops: function() {
				return sortedColorStops;
			},
			setSortedColorStops: function(newSortedColorStops) {
				sortedColorStops = this.sortColorStopsByPositionLeft(newSortedColorStops);
			},
			getOriginalColorStops: function() {
				return originalColorStops;
			},
			setOriginalColorStops: function(newOriginalColorStops) {
				originalColorStops = this.sortColorStopsByPositionLeft(newOriginalColorStops);
			},
			resetOriginalColorStops: function() {
				originalColorStops = [];
			},
			compareColorStops: function() {
				//This function useful for determining if current gradient is in a dirty state
				return _.isMatch(originalColorStops, sortedColorStops);
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
			},
			sortColorStopsByPositionLeft: function(colorStops) {
				var sortedColorStops = [];

				//Sort gradient stops by how far left they are. Allows
				//gradient stops to be ordered and still produce a
				//consistent result.
				bySortedLeftValue(colorStops, function(key, value) {
					sortedColorStops.push(value);
				});

				return sortedColorStops;
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
	.filter('dateGetTime', function() {
	  return function(input) {
	    var date = new Date(input);

	    return date.getTime().toString();
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
	.controller('gradientGridController', ['$scope', '$rootScope', 'gradientService', function($scope, $rootScope, gradientService) {

		$scope.gradientItems = [];

		$scope.init = function() {
			gradientService.getGradients(function(res){
				$scope.gradientItems = res.gradientsFound;
			}, function(err){
				console.log(err);
			});
		};

		$scope.sortOrder = "-createdAt | dateGetTime | number";
		
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