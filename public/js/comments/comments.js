angular.module('coloriAppComments', ['coloriAppAnimator'])
.directive('commentDirective', ['animator', function(animator){
	return {
		restrict: 'E',
		templateUrl: '/partials/directives/comment-directive.html',
		scope: {
			body: '=',
			author: '='
		},
		link: {
			pre: function(scope, element, attributes) {

				animator.scrollTo(element, element.parent().parent().parent());
			}
		}
	}
}]);