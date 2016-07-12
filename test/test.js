'use strict'

const fs = require('fs')

exports.debian = function (test) {
  test.expect(1)
  const actual = fs.readFileSync('dist/demo_0.1-1/DEBIAN/control').toString()
  const expected = fs.readFileSync('test/control').toString()
  test.equal(actual, expected, 'CONTROL file created should equal sample.')
  test.done()
}
