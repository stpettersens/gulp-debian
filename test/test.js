'use strict'

const fs = require('fs-extra')

exports.debian = function (test) {
  test.expect(2)

  // Control file.
  let actual = fs.readFileSync('dist/demo_0.1-2_i386/DEBIAN/control').toString()
  let expected = fs.readFileSync('test/control').toString()
  test.equal(actual, expected, 'CONTROL file created should equal sample.')

  // Changelog.
  /* actual = fs.readFileSync('dist/demo_0.1-2_i386/usr/share/doc/demo/changelog.Debian').toString()
  expected = fs.readFileSync('test/changelog.Debian').toString()
  test.equal(actual, expected, 'changelog.Debian file created should equal sample.')
  test.done() */

  // Debian package.
  const deb = fs.existsSync('dist/demo_0.1-2_i386.deb')
  test.equal(deb, true)
  test.done()
}
