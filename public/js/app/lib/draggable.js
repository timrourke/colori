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
          elm.css({
            left: startX + dx + 'px'
          });
          scope.$apply(function(){
            var leftAmount = (elm.prop('offsetLeft') + (elm[0].clientWidth/2)) / window.innerWidth * 100;
            colorStopRegister.setGradientLeft(attrs.gradientId, leftAmount.toPrecision(7));
            scope.gradientCssString = scope.getGradientCssString();
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