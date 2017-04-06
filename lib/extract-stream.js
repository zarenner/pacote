'use strict'

const tar = require('tar')
const path = require('path')

module.exports = extractStream
function extractStream (dest, opts, cb) {
  opts = opts || {}
  return tar.x({
    cwd: dest,
    filter: makeFilter(opts.log),
    dmode: opts.dmode,
    fmode: opts.fmode,
    umask: opts.umask,
    strip: 1,
    onwarn: msg => opts.log.warn('tar', msg)
  })
}

function makeFilter (opts) {
  var sawEntry = {}
  return function (entry) {
    return _filter(entry.header, sawEntry, opts)
  }
}

function _filter (header, sawIgnores, opts) {
  if (header.typeKey.match(/^.*link$/i)) {
    opts.log.warn(
      'extract-stream',
      'excluding symbolic link',
      header.path, '->', header.linkpath)
    return false
  }

  if (process.platform !== 'win32') {
    header.uid = opts.uid == null ? header.uid : opts.uid
    header.gid = opts.gid == null ? header.gid : opts.gid
  }
  // Note: This mirrors logic in the fs read operations that are
  // employed during tarball creation, in the fstream-npm module.
  // It is duplicated here to handle tarballs that are created
  // using other means, such as system tar or git archive.
  if (header.typeKey.match(/^file$/i)) {
    var base = path.basename(header.path)
    if (base === '.npmignore') {
      sawIgnores[header.path] = true
    } else if (base === '.gitignore') {
      var npmignore = header.path.replace(/\.gitignore$/, '.npmignore')
      if (!sawIgnores[npmignore]) {
        // Rename, may be clobbered later.
        header.path = npmignore
      }
    }
  }

  return true
}
