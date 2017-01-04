### gulp-debian
> :tropical_drink: Gulp plug-in to create a Debian package.

[![Build Status](https://travis-ci.org/stpettersens/gulp-debian.png?branch=master)](https://travis-ci.org/stpettersens/gulp-debian)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)
[![npm version](https://badge.fury.io/js/gulp-debian.svg)](http://npmjs.com/package/gulp-debian)
[![Dependency Status](https://david-dm.org/stpettersens/gulp-debian.png?theme=shields.io)](https://david-dm.org/stpettersens/gulp-debian) [![Development Dependency Status](https://david-dm.org/stpettersens/gulp-debian/dev-status.png?theme=shields.io)](https://david-dm.org/stpettersens/gulp-debian#info=devDependencies)

##### Install

    $ npm install --save-dev gulp-debian

##### Usage

Define package in-line:

```js
'use strict'

const gulp = require('gulp')
const deb = require('gulp-debian')

gulp.task('default', function () {
  return gulp.src(['demo.sh','blob.bin'])
  .pipe(deb({
    package: 'demo',
    version: '0.1-2',
    section: 'base',
    priority: 'optional',
    architecture: 'i386',
    maintainer: 'Mr. Apt <apt@nowhere.tld>',
    description: 'A dummy package',
    preinst: [ 'echo "hello from dummy package"' ],
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
    _out: 'dist',
    _verbose: true
  }))
})
```

Alternatively, you can define your package in an external [JSON file](demo_0.1-2_i386.json):

```js
gulp.task('default', function () {
  return gulp.src(['demo.sh', 'blob.bin'])
  .pipe(deb('demo_0.1-2_i386.json'))
})
```

You can also use a YAML file to define your package. Just convert it to an Object first using
the [js-yaml](https://github.com/nodeca/js-yaml) module (`npm install --save js-yaml`):

```js
const YAML = require('json-yaml)
const fs = require('fs')

gulp.task('default', function () {
  return gulp.src(['demo.sh', 'blob.bin'])
  .pipe(deb(YAML.load(fs.readFileSync('demo_0.1-2_i386.yml').toString())))
})
```

##### Options

* Options: Object containing properties for a Debian file and the following parameters:
  	* preinst: Array of commands to run for the package's *pre-install* script (optional).
  	* postint: Array of commmands to run for the package's *post-install* script (optional).
  	* changelog: Array of versions and their changes to write to the package's *changelog* (optional, but recommended). Options are:
  		* version: String for version with changes.
  		* distribution: String for version distribution.
  		* urgency: String for version urgency.
  		* date: Date object or String in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) notation for version date.
  		* changes: Array of changes made.
	* _target: string - The installation target for the created Debian package (mandatory).
	* _out: string - The target directory to create the Debian package in (mandatory).
	* _verbose: boolean - Verbose output from dpkg-deb utility (optional; true if omitted).

  (or)

  * String containing filename for external JSON file defining package.

##### Contributors

* [Sam Saint-Pettersen](https://github.com/stpettersens)
* [Oliver Skånberg-Tippen](https://github.com/oskanberg)
* [Olaf Radicke](https://github.com/OlafRadicke)


##### License

[MIT](https://opensource.org/licenses/MIT)
