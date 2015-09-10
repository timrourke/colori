// global js
/**
 * @param {function} a The function to execute when the DOM is ready
 *
 * Source: https://gist.github.com/dciccale/4087856
 */

var DOMReady = function(a,b,c){b=document,c='addEventListener';b[c]?b[c]('DOMContentLoaded',a):window.attachEvent('onload',a)}

DOMReady(function () {
  //Test support for -webkit-background-clip:text;
	if(document.body.style.webkitBackgroundClip !== undefined){
		document.documentElement.className += ' backgroundclip';
	}
});