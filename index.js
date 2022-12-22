'use strict'

const gutil = require('gulp-util')
const through = require('through2')
const titleCase = require('title-case')
const fs = require('fs-extra')
const find = require('find')
const _exec = require('child_process').exec

const P = 'gulp-debian'
const dirMode = 755 /* chmod param for directory */
const fileMode = 644 /* chmod param for ordinary file */

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
      log.push(`  * ${pkg.changelog[i].changes[x]}`)
    }
    const ts = Date.parse(pkg.changelog[i].date)
    var d = new Date(ts)
    d = d.toString().replace(/([a-zA-Z]*) ([a-zA-Z]*) ([0-9]*) ([0-9]*) ([0-9:]*) GMT(.....) .*/, '$1, $3 $2 $4 $5 $6')
    log.push(`\n -- ${pkg.maintainer}  ${d}\n`)
  }
  log.push('')
  return log
}

function writeChangelog (pkg, out, cb) {
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
        _exec(`gzip -fn9 ${logo}; chmod ${fileMode} ${logo}.gz`,
          function (err, stdout, stderr) {
            if (stderr) {
              gutil.log(gutil.colors.red(stderr.trim()))
              cb(err)
            }
          })
      })
  }
}

function installScript (fn, script, out, cb) {
  if (script !== undefined && script.length > 0) {
    const o = `${out}/DEBIAN/${fn}`
    if (typeof script === 'string') {
      if (fs.existsSync(script)) {
        fs.copySync(script, o)
        fs.chmodSync(o, parseInt('0755', 8))
      } else {
        cb(new gutil.PluginError(P, `File ${script} not exist!`))
        // return
      }
    } else {
      script.push('')
      fs.outputFile(o, script.join('\n'), function (err) {
        if (err) {
          cb(new gutil.PluginError(P, err))
          // return
        }
        fs.chmodSync(o, parseInt('0755', 8))
      })
    }
  }
}

function installCopyright (pn, path, out, cb) {
  if (fs.existsSync(path)) {
    const o = `${out}/usr/share/doc/${pn}/copyright`
    fs.copySync(path, o)
    fs.chmodSync(o, parseInt('0644', 8))
  } else {
    gutil.log(gutil.colors.red(`Error reading copyright file!`))
  }
}

function installConffiles (path, out, cb) {
  var conffiles = []
  var files = find.fileSync(path)
  path = path.replace(/\/$/, '')
  files.forEach(function (item) {
    let pathDest = item.split('/').slice(path.split('/').length)
    fs.copySync(item, `${out}/${pathDest.join('/')}`)
    fs.chmodSync(`${out}/${pathDest.join('/')}`, parseInt(`0${fileMode}`, 8))
    pathDest = '/' + pathDest.join('/')
    conffiles.push(pathDest)
  })
  conffiles.push('')
  fs.outputFileSync(`${out}/DEBIAN/conffiles`, conffiles.join('\n'))
  fs.chmodSync(`${out}/DEBIAN/conffiles`, parseInt(`0${fileMode}`, 8))
}

function chmodRegularFile (path, cb) {
  if (fs.statSync(path).isFile()) {
    fs.chmodSync(path, parseInt(`0${fileMode}`, 8))
  } else {
    fs.readdirSync(path).forEach(file => {
      chmodRegularFile(`${path}/${file}`, cb)
    })
  }
}

module.exports = function (pkg) {
  let files = []
  return through.obj(function (file, enc, cb) {
    if (file.isStream()) {
      cb(new gutil.PluginError(P, 'Streaming not supported.'))
      // return
    }
    files.push(file)
    cb(null)
  }, function (cb) {
    if (typeof pkg === 'string') {
      pkg = fs.readJSONSync(pkg)
    }
    deb(files, pkg, function (err, ctrl) {
      if (pkg._verbose === undefined) {
        pkg._verbose = true
      }
      if (pkg._target === undefined || pkg._out === undefined) {
        cb(new gutil.PluginError(P, '_target and/or _out undefined.'))
        // return
      }
      if (pkg._copyright === undefined) {
        gutil.log(gutil.colors.cyan('_copyright may be omitted, but it is highly recommended to define.'))
        // cb(new gutil.PluginError(P, '_copyright undefined!'))
        // return
      }
      if (err) {
        cb(new gutil.PluginError(P, err, {filename: files[0].path}))
        // return
      }
      let out = `${pkg._out}/${pkg.package}_${pkg.version}_${pkg.architecture}`
      installScript('preinst', pkg.preinst, out, cb)
      installScript('postinst', pkg.postinst, out, cb)
      installScript('prerm', pkg.prerm, out, cb)
      installScript('postrm', pkg.postrm, out, cb)
      installCopyright(pkg.package, pkg._copyright, out, cb)
      installConffiles(pkg.conffiles, out, cb)
      ctrl = ctrl.filter(function (line) {
        if (!/Out|Target|Verbose|Changelog|Preinst|Postinst|Prerm|Postrm|Clean|Copyright|Conffiles/.test(line)) {
          return line
        }
      })

      writeChangelog(pkg, out, cb)
      /* @lucomsky's commit replaced this.
      Kept only for reference. Will remove in future:
      const logf = changelog(pkg)
      if (logf.length > 0) {
        const logp = `${out}/usr/share/doc/${pkg.package}`
        const logo = `${logp}/changelog.Debian`
        fs.mkdirpSync(logp)
        fs.outputFile(logo, logf.join('\n'),
        function (err) {
          if (err) {
            cb(new gutil.PluginError(P, err))
            // return
          }
          let gzip = fs.createWriteStream(`${logo}.gz`)
          let logg = fs.createReadStream(logo)
          try {
            logg
            .pipe(zlib.createGzip())
            .pipe(gzip)
          } catch (e) {
            gutil.log(gutil.colors.red(`Error creating ${gzip} for changelog!`))
            gutil.log(e.stack)
          } finally {
            if (fs.existsSync(logo)) {
              fs.removeSync(logo)
            }
          }
        })
      }
      */
      
      fs.mkdir(`${out}/DEBIAN`, '0775', function (err) {
        if (err) {
          cb(new gutil.PluginError(P, err))
          // return
        }
        const ctrlf = ctrl.join('\n')
        fs.outputFile(`${out}/DEBIAN/control`, ctrlf.substr(0, ctrlf.length - 1),
        function (err) {
          if (err) {
            cb(new gutil.PluginError(P, err))
            // return
          }
          files.map(function (f) {
            let t = f.path.split('/')
            t = t[t.length - 1]
            fs.copySync(f.path, `${out}/${pkg._target}/${t}`)
            chmodRegularFile(`${out}/${pkg._target}/${t}`)
          })
          _exec(`chmod ${dirMode} $(find ${pkg._out} -type d)`)
          _exec(`dpkg-deb --build ${pkg._out}/${pkg.package}_${pkg.version}_${pkg.architecture}`,
          function (err, stdout, stderr) {
            if (pkg._clean) {
              fs.removeSync(`${pkg._out}/${pkg.package}_${pkg.version}_${pkg.architecture}`)
            }
            if (pkg._verbose && stdout.length > 1) {
              gutil.log(stdout.trim() + '\n')
            }
            if (stderr) {
              gutil.log(gutil.colors.red(stderr.trim()))
            }
            cb(err)
          })
        })
      })
    })
  })
}
