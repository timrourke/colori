"use strict";

var debug = require('debug')('app:gradientUtils:' + process.pid),
		autoprefixer	=	require('autoprefixer'),
		postcss				=	require('postcss');


module.exports.autoprefixCss = function(inputCssString, callback) {

	postcss([ autoprefixer({ browsers: ['> 1%', 'IE 7'], cascade: false }) ]).process(inputCssString).then(function(result) {
		result.warnings().forEach(function(warn) {
	      console.warn(warn.toString());
	      debug(warn.toString());
	  });
	  callback(null, result.css);
	}).catch(function(err){
		return callback(err);
	});
	
}
