angular.module('coloriAppGradientEditor', [])
.controller('gradientController', ['$scope', '$compile', '$location', 'colorStopRegister', 'gradientService', '$stateParams', 'GradientSaveFailed', 'ToastFactory', 
		function($scope, $compile, $location, colorStopRegister, gradientService, $stateParams, GradientSaveFailed, ToastFactory) {

		/**
		 * Gradient utility functions
		 *
		 */

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

		$scope.gradient = {};

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

						//Set original colorstops state
						colorStopRegister.setOriginalColorStops(res.gradientFound.color_stops);
					}, function(err){
						console.log(err);
					});
			
			} else {
				// If not displaying a predefined a gradient, display a blank canvas
				$scope.colorStops = colorStopRegister.getColorStops();
				colorStopRegister.setOriginalColorStops($scope.colorStops);
			}

		};

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

		var getGradientCssString = function() {
			var colorStops = colorStopRegister.sortColorStopsByPositionLeft(colorStopRegister.getColorStops());
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
			colorStopRegister.setSortedColorStops($scope.colorStops);
		});

		/**
		 * Angle management
		 *
		 */

		$scope.dialAngle = colorStopRegister.getAngle();

		$scope.$watch(function(scope){
			return colorStopRegister.getAngle();
		}, function(newValue, oldValue){
			colorStopRegister.setAngle(newValue);
			$scope.dialAngle = colorStopRegister.getAngle();
		});

		/**
		 * Gradient UI state functions
		 *
		 */

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
				color_stops: colorStopRegister.sortColorStopsByPositionLeft(colorStopRegister.getColorStops()),
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

		$scope.init();

	}])