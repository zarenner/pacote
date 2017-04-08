'use strict'

const BB = require('bluebird')

const execFileAsync = BB.promisify(require('child_process').execFile)
const which = require('which')

let KEYBASE
try {
  KEYBASE = which.sync('keybase')
} catch (e) {}

module.exports = verifySignature
function verifySignature (signer, message) {
  if (!KEYBASE) {
    return BB.reject(new Error(`Cannot verify message by ${signer}: no keybase binary available`))
  }
  return execFileAsync('keybase', [
    'verify', '--signed-by=' + signer, '-m', message.trim()
  ])
}

module.exports.hasKeybase = !!KEYBASE
