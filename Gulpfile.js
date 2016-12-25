'use strict'

const gulp = require('gulp')
const clean = require('gulp-rimraf')
const sequence = require('gulp-sequence')
const standard = require('gulp-standard')
const nodeUnit = require('gulp-nodeunit-runner')
const wait = require('gulp-wait')
const glob = require('glob')
const deb = require('./')

gulp.task('deb', function () {
  return gulp.src(['.gitignore', '.npmignore'])
  .pipe(deb({
    package: 'demo',
    version: '0.1-2',
    section: 'base',
    priority: 'optional',
    architecture: 'i386',
    maintainer: 'Mr. Apt <apt@nowhere.tld>',
    description: 'A dummy package',
    changelog: [
      {
        version: '0.1-2',
        distribution: 'unstable',
        urgency: 'low',
        date: new Date('2016-12-24T12:40:10'),
        changes: [
          'Added another feature.',
          'Fixed feature X.'
        ]
      },
      {
        version: '0.1-1',
        distribution: 'unstable',
        urgency: 'low',
        date: '2016-12-23T11:24:00',
        changes: [
          'First release.'
        ]
      }
    ],
    _target: 'opt/demo',
    _out: 'dist',
    _verbose: true
  }))
})

gulp.task('standard', function () {
  return gulp.src(['*.js', 'test/*.js'])
  .pipe(standard())
  .pipe(standard.reporter('default', {
    breakOnError: true
  }))
})

gulp.task('nodeunit', function () {
  return gulp.src('test/test.js')
  .pipe(wait(1500))
  .pipe(nodeUnit())
})

gulp.task('ls', function () {
  for (let p in glob.sync('dist')) {
    console.log(p)
  }
})

gulp.task('clean', function () {
  return gulp.src('dist')
  .pipe(clean())
})

gulp.task('default', ['deb'])
gulp.task('test', sequence('standard', 'nodeunit', 'ls'))
