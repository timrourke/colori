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

	this.fadeInUp = function($element, delay) {
		return $q(function(resolve){
			$($element).velocity({
				opacity: 1,
				translateY: [0, '100px']
			}, {
				delay: (delay * 75) + 300,
				duration: 700,
				complete: function() {
					resolve();
				}
			});
		});
	}

	this.scrollTo = function($element, container) {
		//Absurdly high negative offset ensures comment list will be at the top of the list upon first view.
		return $q(function(resolve){
			$($element).velocity('scroll', {
				container: $(container),
				offset: '-10000',
				duration: 200,
				complete: function() {
					resolve();
				}
			});
			$($element).velocity({
				translateX: [0, '-100%'],
				opacity: [1,0]	
			});
		});
	};

}]);