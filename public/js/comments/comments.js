angular.module('coloriAppComments', [])
.directive('commentDirective', ['animator', function(animator){
	return {
		restrict: 'E',
		templateUrl: '/partials/directives/comment-directive.html',
		scope: {
			body: '=',
			author: '=',
			authoravatar: '=',
			posted: '='
		},
		link: {
			pre: function(scope, element, attributes) {
				angular.element(element).css({'opacity':0});
				animator.scrollTo(element, element.parent().parent().parent());
			}
		}
	}
}]);