/**
 * @see https://github.com/siongui/palidictionary/blob/master/static/js/draggable.js
 * @see http://docs.angularjs.org/guide/compiler 
 */

angular.module('draggableModule', []).
  directive('draggable', ['$document', 'colorStopRegister', function($document, colorStopRegister) {
    return {
      restrict: 'A',
      controller: 'gradientController',
      link: function(scope, elm, attrs) {
        var startX, startY, initialMouseX, initialMouseY;
        elm.css({position: 'absolute'});
 
        elm.bind('mousedown', function($event) {
          startX = elm.prop('offsetLeft');
          startY = elm.prop('offsetTop');
          initialMouseX = $event.clientX;
          initialMouseY = $event.clientY;
          $document.bind('mousemove', mousemove);
          $document.bind('mouseup', mouseup);
          return false;
        });
 
        function mousemove($event) {
          var dx = $event.clientX - initialMouseX;
          //var dy = $event.clientY - initialMouseY;
          elm.css({
            //top:  startY + dy + 'px',
            left: startX + dx + 'px'
          });
          scope.$apply(function(){
          	// scope.gradients[attrs.gradientId] = {
          	// 	//top: $event.clientY / window.innerHeight * 100,
          	// 	//left: $event.clientX / window.innerWidth * 100
          	// 	left: (elm.prop('offsetLeft') + (elm.prop('clientWidth')/2)) / window.innerWidth * 100,
           //    color: scope.gradients[attrs.gradientId].color
          	// }
            var leftAmount = (elm.prop('offsetLeft') + (elm[0].clientWidth/2)) / window.innerWidth * 100;
            colorStopRegister.setGradientLeft(attrs.gradientId, leftAmount.toPrecision(7)); 
          });         
          return false;
        }
 
        function mouseup() {
          $document.unbind('mousemove', mousemove);
          $document.unbind('mouseup', mouseup);
        }
      }
    };
  }]);