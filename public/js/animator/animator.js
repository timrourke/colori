angular.module('coloriAppAnimator', [])
.service('animator', ['$q', function($q){

	this.fadeOut = function($element) {
		return $q(function(resolve){
			$($element).velocity({
				opacity: 0
			}, {
				duration: 200,
				complete: function() {
					console.log('done animating');
					resolve();
				}
			});
		});
	};

	this.fadeIn = function($element) {
		return $q(function(resolve){
			$($element).velocity({
				opacity: [1,0]
			}, {
				duration: 200,
				complete: function() {
					console.log('done animating');
					resolve();
				}
			});
		});
	};

	this.scrollTo = function($element, container) {
		console.log('hi')
		return $q(function(resolve){
			$($element).velocity('scroll', {
				container: $(container),
				duration: 200,
				complete: function() {
					console.log('done animating');
					resolve();
				}
			});
		});
	};

}]);