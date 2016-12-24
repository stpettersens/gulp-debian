'use strict'

const fs = require('fs')

exports.debian = function (test) {
  test.expect(1)
  const actual = fs.readFileSync('dist/demo_0.1-2_i386/DEBIAN/control').toString()
  const expected = fs.readFileSync('test/control').toString()
  test.equal(actual, expected, 'CONTROL file created should equal sample.')
  test.done()
}

exports.changelog = function (test) {
  test.expect(1)
  const actual = fs.readFileSync('dist/demo_0.1-2_i386/usr/share/doc/changelog.Debian').toString()
  const expected = fs.readFileSync('test/changelog.Debian').toString()
  test.equal(actual, expected, 'changelog.Debian file created should equal sample.')
  test.done()
}
