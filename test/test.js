'use strict'

const fs = require('fs-extra')

exports.debian = function (test) {
  test.expect(3)

  // Control file.
  let actual = fs.readFileSync('dist/demo_0.1-2_i386/DEBIAN/control').toString()
  let expected = fs.readFileSync('test/control').toString()
  test.equal(actual, expected, 'CONTROL file created should equal sample.')

  // Preinst script.
  actual = fs.readFileSync('dist/demo_0.1-2_i386/DEBIAN/preinst').toString()
  expected = fs.readFileSync('test/preinst').toString()
  test.equal(actual, expected, 'PREINST file created should equal sample.')

  // Postinst script.
  actual = fs.readFileSync('dist/demo_0.1-2_i386/DEBIAN/postinst').toString()
  expected = fs.readFileSync('test/postinst').toString()
  test.equal(actual, expected, 'POSTINST file created should equal sample.')

  // Changelog.
  /* const actual = fs.readFileSync('dist/demo_0.1-2_i386/usr/share/doc/demo/changelog.Debian').toString()
  const expected = fs.readFileSync('test/changelog.Debian').toString()
  test.equal(actual, expected, 'changelog.Debian file created should equal sample.')
  test.done() */

  // Debian package.
  const deb = fs.existsSync('dist/demo_0.1-2_i386.deb')
  test.equal(deb, true)  
  test.done()
}
