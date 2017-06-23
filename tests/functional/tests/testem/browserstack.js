var
  path = require('path'),
  Bluebird = require('bluebird'),
  fs = Bluebird.promisifyAll(require('fs')),
  chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  Process = require('./../../../../lib/core/process').Process,
  utils = require('./../testutils')

chai.use(chaiAsPromised)

var
  expect = chai.expect,
  should = chai.should()

describe('BrowserStack', function() {

  this.timeout(0)

  it('should work in testem ci mode for a jasmine-1.x test', function() {
    var proc = new Process(), out = ''
    return proc
    .create('node', [
        path.resolve(process.cwd(), 'node_modules/testem/testem.js'),
        'ci',
        '-f',
        path.resolve(process.cwd(), 'tests/functional/conf/testem/jasmine-1.json')
    ], {
      onstdout: function(stdout) {
        out += stdout
        console.log('stdout: ', stdout.trim())
      },
      onstderr: function(stderr) {
        utils.log.error(stderr)
      }
    })
    .then(() => {
      if(!out.match(/Safari 9.1 \- sum should return the sum of two numbers./)) {
        utils.log.warn('Safari 9.1 sum test failed')
      }
      if(!out.match(/Safari 9.1 \- mult should return the product of two numbers./)) {
        utils.log.warn('Safari 9.1 mult test failed')
      }
      if(!out.match(/Firefox 43.0 \- sum should return the sum of two numbers./)) {
        utils.log.warn('Firefox 43.0 sum test failed')
      }
      if(!out.match(/Firefox 43.0 \- mult should return the product of two numbers./)) {
        utils.log.warn('Firefox 43.0 mult test failed')
      }
      if(!out.match(/Chrome 51.0 \- sum should return the sum of two numbers./)) {
        utils.log.warn('Chrome 51.0 sum test failed')
      }
      if(!out.match(/Chrome 51.0 \- mult should return the product of two numbers./)) {
        utils.log.warn('Chrome 51.0 mult test failed')
      }
      if(!out.match(/IE 11.0 \- sum should return the sum of two numbers./)) {
        utils.log.warn('IE 11.0 sum test failed')
      }
      if(!out.match(/IE 11.0 \- mult should return the product of two numbers./)) {
        utils.log.warn('IE 11.0 mult test failed')
      }
      if(!out.match(/# tests 8/)) {
        utils.log.warn('not all 8 tests ran')
      }
      if(!out.match(/# pass  8/)) {
        utils.log.warn('not all 8 tests passed')
      }
      if(out.match(/# tests 0/)) {
        utils.log.warn('no tests ran')
      }
      if(out.match(/# pass  0/)) {
        utils.log.warn('no tests passed')
      }
      return true
    })
    .catch(err => {
      utils.log.error(err)
      throw err
    })
    .should.be.fulfilled
  })
})
