'use strict';

const gulp = require('gulp'),
     clean = require('gulp-rimraf'),
       deb = require('./');

gulp.task('deb', function() {
	return gulp.src(['.gitignore','.npmignore'])
	.pipe(deb({
		package: 'demo',
		version: '0.1-1',
		section: 'base',
		priority: 'optional',
		architecture: 'i386',
		maintainer: 'Mr. Apt <apt@nowhere.tld>',
		description: 'A dummy package',
		_target: 'opt/demo',
		_out: 'dist',
		_verbose: true,
		_ignore: ['.npmignore']
	 }));
});

gulp.task('clean', function() {
	return gulp.src('dist')
	.pipe(clean());
});

gulp.task('default', ['deb'], function(){});
