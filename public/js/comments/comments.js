angular.module('coloriAppComments', [])
.directive('commentDirective', ['animator', function(animator){
	return {
		restrict: 'E',
		templateUrl: '/partials/directives/comment-directive.html',
		scope: {
			body: '=',
			author: '=',
			posted: '='
		},
		link: {
			pre: function(scope, element, attributes) {

				animator.scrollTo(element, element.parent().parent().parent());
			}
		}
	}
}]);