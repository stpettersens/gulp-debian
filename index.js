'use strict'

/* global chmod */

const gutil = require('gulp-util')
const through = require('through2')
const titleCase = require('title-case')
const fs = require('fs-extra')
const zlib = require('zlib')
const _exec = require('child_process').exec
require('shelljs/global')

const P = 'gulp-debian'

function deb (files, pkg, cb) {
  let ctrl = []
  for (let key in pkg) {
    ctrl.push(`${titleCase(key)}: ${pkg[key]}`)
  }
  ctrl.push(' ')
  return cb(null, ctrl)
}

function changelog (pkg) {
  let log = []
  for (let i = 0; i < pkg.changelog.length; i++) {
    let header = `${pkg.package} (${pkg.changelog[i].version}) `
    header += `${pkg.changelog[i].distribution}; urgency=${pkg.changelog[i].urgency}`
    log.push(header + '\n')
    for (let x = 0; x < pkg.changelog[i].changes.length; x++) {
      log.push(`\t * ${pkg.changelog[i].changes[x]}`)
    }
    const ts = Date.parse(pkg.changelog[i].date)
    log.push(`\n-- ${pkg.maintainer} ${new Date(ts)}\n`)
  }
  return log
}

function installScript (fn, script, out, cb) {
  if (script !== undefined && script.length > 0) {
    script.push('')
    const o = `${out}/DEBIAN/${fn}`
    fs.outputFile(o, script.join('\n'), function (err) {
      if (err) {
        cb(new gutil.PluginError(P, err))
        return
      }
      chmod(755, o)
    })
  }
}

module.exports = function (pkg) {
  let files = []
  return through.obj(function (file, enc, cb) {
    if (file.isStream()) {
      cb(new gutil.PluginError(P, 'Streaming not supported.'))
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
        cb(new gutil.PluginError(P, '_target and/or _out undefined.'))
        return
      }
      if (err) {
        cb(new gutil.PluginError(P, err, {filename: files[0].path}))
        return
      }
      let out = `${pkg._out}/${pkg.package}_${pkg.version}_${pkg.architecture}`
      installScript('preinst', pkg.preinst, out, cb)
      installScript('postinst', pkg.postinst, out, cb)
      ctrl = ctrl.filter(function (line) {
        if (!/Out|Target|Verbose|Changelog|Preinst|Postinst/.test(line)) {
          return line
        }
      })
      const logf = changelog(pkg)
      if (logf.length > 0) {
        const logp = `${out}/usr/share/doc/${pkg.package}`
        const logo = `${logp}/changelog.Debian`
        fs.mkdirpSync(logp)
        fs.outputFile(logo, logf.join('\n'),
        function (err) {
          if (err) {
            cb(new gutil.PluginError(P, err))
            return
          }
          let gzip = fs.createWriteStream(`${logo}.gz`)
          let logg = fs.createReadStream(logo)
          try {
            logg
            .pipe(zlib.createGzip())
            .pipe(gzip)
          } catch (e) {
            gutil.log(gutil.colors.red(`Error creating ${gzip}!`))
            gutil.log(e.stack)
          } finally {
            if (fs.existsSync(logo)) {
              fs.removeSync(logo)
            }
          }
        })
      }
      const ctrlf = ctrl.join('\n')
      fs.outputFile(`${out}/DEBIAN/control`, ctrlf.substr(0, ctrlf.length - 1),
      function (err) {
        if (err) {
          cb(new gutil.PluginError(P, err))
          return
        }
        files.map(function (f) {
          let t = f.path.split('/')
          t = t[t.length - 1]
          fs.copySync(f.path, `${out}/${pkg._target}/${t}`)
        })
        _exec(`dpkg-deb --build ${pkg._out}/${pkg.package}_${pkg.version}_${pkg.architecture}`,
        function (err, stdout, stderr) {
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
