'use strict'

/* global exec */

const gulp = require('gulp')
const clean = require('gulp-rimraf')
const sequence = require('gulp-sequence')
const standard = require('gulp-standard')
const nodeUnit = require('gulp-nodeunit-runner')
const wait = require('gulp-wait')
const chalk = require('chalk')
const glob = require('glob')
const deb = require('./')
const YAML = require('js-yaml')
const j2y = require('./json2yaml')
const fs = require('fs')
require('shelljs/global')

const PKG_JSON = 'demo_0.1-2_i386.json'
const PKG_YAML = 'demo_0.1-2_i386.yml'

gulp.task('deb-inline', function () {
  return gulp.src(['.gitignore', '.npmignore'])
  .pipe(deb({
    package: 'demo',
    version: '0.1-2',
    section: 'base',
    priority: 'optional',
    architecture: 'i386',
    maintainer: 'Mr. Apt <apt@nowhere.tld>',
    description: 'A dummy package\n Long description starts here...',
    preinst: 'test/preinst',
    postinst: [ 'cat -n /opt/demo/.npmignore' ],
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
    _copyright: 'test/copyright',
    _out: 'dist',
    _verbose: true
  }))
})

gulp.task('json2yaml', function () {
  j2y.JSON2YAML(PKG_JSON)
})

gulp.task('deb-json', function () {
  return gulp.src(['.gitignore', '.npmignore'])
  .pipe(deb(PKG_JSON))
})

gulp.task('deb-yaml', function () {
  return gulp.src(['.gitignore', '.npmignore'])
  .pipe(deb(YAML.load(fs.readFileSync(PKG_YAML).toString())))
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
  let ls = glob.sync('dist/*/**')
  console.log('')
  for (let i = 0; i < ls.length; i++) {
    console.log(chalk.cyan(ls[i]))
  }
  console.log('')
  ls = glob.sync('dist/*.deb')
  for (let i = 0; i < ls.length; i++) {
    console.log(chalk.blue(ls[i]))
  }
  console.log('')
})

gulp.task('dpkg', function () {
  exec('dpkg-deb -I dist/demo_0.1-2_i386.deb')
  console.log('')
  exec('dpkg-deb -I dist/demo-from-json_0.1-2_i386.deb')
  console.log('')
  exec('dpkg-deb -I dist/demo-from-yaml_0.1-2_i386.deb')
})

gulp.task('install', function () {
  exec('sudo dpkg -i dist/demo_0.1-2_i386.deb')
})

gulp.task('clean', function () {
  return gulp.src(['dist', 'demo_0.1-2_i386.yml'])
  .pipe(clean())
})

gulp.task('default', ['deb-inline'])
gulp.task('test', sequence('standard', 'nodeunit', 'ls', 'dpkg'))
