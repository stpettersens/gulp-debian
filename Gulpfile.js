'use strict'

const gulp = require('gulp')
const clean = require('gulp-rimraf')
const sequence = require('gulp-sequence')
const standard = require('gulp-standard')
const deb = require('./')

gulp.task('deb', function () {
  return gulp.src(['.gitignore', '.npmignore'])
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
    _verbose: true
  }))
})

gulp.task('standard', function () {
  return gulp.src('*.js')
  .pipe(standard())
  .pipe(standard.reporter('default', {
    breakOnError: true
  }))
})

gulp.task('nodeunit', function () {
  // TODO!
})

gulp.task('clean', function () {
  return gulp.src('dist')
  .pipe(clean())
})

gulp.task('default', ['deb'])
gulp.task('test', sequence('standard', 'deb', 'assert'))
