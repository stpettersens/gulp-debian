'use strict'

const gutil = require('gulp-util')
const through = require('through2')
const titleCase = require('title-case')
const fs = require('fs-extra')
const _exec = require('child_process').exec

function deb (files, pkg, cb) {
  let ctrl = []
  for (let key in pkg) {
    ctrl.push(`${titleCase(key)}: ${pkg[key]}`)
  }
  ctrl.push(' ')
  return cb(null, ctrl)
}

module.exports = function (pkg) {
  let files = []
  return through.obj(function (file, enc, cb) {
    if (file.isStream()) {
      cb(new gutil.PluginError('gulp-debian', 'Streaming not supported.'))
      return
    }
    files.push(file)
    cb(null)
  }, function (cb) {
    deb(files, pkg, function (err, ctrl) {
      if (pkg._verbose === undefined) {
        pkg._verbose = true
      }
      if (pkg._target === undefined || pkg._out === undefined) {
        cb(new gutil.PluginError('gulp-debian', '_target and/or _out undefined.'))
        return
      }
      if (err) {
        cb(new gutil.PluginError('gulp-debian', err, {filename: files[0].path}))
        return
      }
      let out = `${pkg._out}/${pkg.package}_${pkg.version}_${pkg.architecture}`
      ctrl = ctrl.filter(function (line) {
        if (!/Out|Target|Verbose/.test(line)) {
          return line
        }
      })
      const ctrlf = ctrl.join('\n')
      fs.outputFile(`${out}/DEBIAN/control`, ctrlf.substr(0, ctrlf.length - 1), function (err) {
        if (err) {
          cb(new gutil.PluginError('gulp-debian', err))
          return
        }
        files.map(function (f) {
          let t = f.path.split('/')
          t = t[t.length - 1]
          fs.copySync(f.path, `${out}/${pkg._target}/${t}`)
        })
        _exec(`dpkg-deb --build ${pkg._out}/${pkg.package}_${pkg.version}_${pkg.architecture}`, function (err, stdout, stderr) {
          if (pkg._verbose && stdout.length > 1) {
            gutil.log(stdout.trim() + '\n')
          }
          if (stderr) {
            gutil.log(gutil.colors.red(stderr.trim()))
            cb(err)
          }
        })
      })
    })
  })
}
