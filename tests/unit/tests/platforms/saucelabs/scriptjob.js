'use strict';

var
  chai = require('chai'),
  ScriptJob = require('./../../../../../lib/platforms/saucelabs/scriptjob').ScriptJob,
  Tunnel = require('./../../../../../lib/platforms/saucelabs/tunnel').Tunnel,
  utils = require('./utils')

var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
var
  expect = chai.expect,
  should = chai.should()

const
  script = (driver, webdriver) => {
    return driver.getTitle()
    .then(function(title) {
      utils.log.debug(title)
      return true
    })
  }

if(process.version > 'v6') {

  describe('ScriptJob', function() {

    describe('create', function() {

      this.timeout(0)

      it('should fail to create a script job if an unsupported browser name is provided', function() {
        expect(()=>{new ScriptJob('http://google.com', {
          browser: 'SomeBrowser',
          os: 'Windows',
          osVersion: '10',
          browserVersion: '40.0'
        }, { })})
        .to.throw('invalid browser "SomeBrowser" for osVersion "10" for os "Windows"')
      })

      it('should fail to create a script job if an unsupported browser version is provided', function() {
        expect(()=>{new ScriptJob('http://google.com', {
          browser: 'Chrome',
          browserVersion: '1.0',
          os: 'OS X',
          osVersion: 'Sierra'
        }, { })})
        .to.throw('invalid version "1.0" for browser "Chrome" for osVersion "Sierra" for os "OS X"')
      })

      it('should fail to create a script job if an unsupported platform is provided', function() {
        expect(()=>{new ScriptJob('http://google.com', {
          browser: 'Chrome',
          browserVersion: '41.0',
          os: 'Ubuntu',
          osVersion: '3.0'
        }, { })})
        .to.throw('invalid os "Ubuntu"')
      })

      it('should fail to create a script job if an unsupported platform version is provided', function() {
        expect(()=>{new ScriptJob('http://google.com', {
          browser: 'Chrome',
          browserVersion: '40.0',
          os: 'Windows',
          osVersion: 'XP'
        }, { })})
        .to.throw('invalid osVersion "XP" for os "Windows"')
      })

      it('should create a script job if a remote url and a valid browser is provided', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://google.com', {
          browser: 'Chrome',
          browserVersion: '41.0',
          os: 'Windows',
          osVersion: '8.1'
        }, {
          build: build.build,
          test: build.test,
          project: build.project
        })
        return scriptJob.create()
        .then(() => {
          return scriptJob.driver.quit()
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

    })

    describe('run', function() {

      this.timeout(0)

      it('should fail if session is not created yet', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://google.com', {
          browser: 'Chrome',
          browserVersion: '41.0',
          os: 'Windows',
          osVersion: '8.1'
        }, {
          build: build.build,
          test: build.test,
          project: build.project
        })
        expect(() => { return scriptJob.run() }).to.throw('Platforms.Core.ScriptJob: Driver not created yet')
      })

      it('should fail if an empty url is provided while creating the session', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('', {
          browser: 'Chrome',
          browserVersion: '38.0',
          os: 'Windows',
          osVersion: '7'
        }, {
          build: build.build,
          test: build.test,
          project: build.project
        })
        var error
        return scriptJob.create()
        .then(() => {
          return scriptJob.run(script)
        })
        .catch(err => {
          error = err
          return scriptJob.driver.quit()
        }).
        then(() => {
          throw error
        })
        .should.be.rejectedWith('Cannot navigate to invalid URL')
      })

      it('should run the script if a remote url, valid values for all mandatory parameters, and screenshot key are provided while creating the session', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Firefox',
          browserVersion: '41.0',
          os: 'OS X',
          osVersion: 'Yosemite'
        }, {
          build: build.build,
          test: build.test,
          project: build.project,
          screenshots: true
        })
        return scriptJob.create()
        .then(() => {
          return scriptJob.run(script)
        })
        .then(() => {
          return scriptJob.driver.quit()
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

      it('should fail to run the script if a local url and valid values for all mandatory parameters are provided but the local capability key is not provided while creating the session', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://build.cross-browser-tests-runner.org:3000/tests/pages/tests.html', {
          browser: 'Chrome',
          browserVersion: '35.0',
          os: 'OS X',
          osVersion: 'Mavericks'
        }, {
          build: build.build,
          test: build.test,
          project: build.project
        })
        var match
        return scriptJob.create()
        .then(() => {
          return scriptJob.run(script)
        })
        .then(() => {
          return scriptJob.driver.getPageSource()
        })
        .then(source => {
          match = source.match(/http:\/\/build\.cross\-browser\-tests\-runner\.org:3000\/tests\/pages\/tests\.html is not available/)
          return scriptJob.driver.quit()
        })
        .then(() => {
          if(match) {
            return true
          }
          else {
            throw new Error('Did not get expected page source of failure to connect with build.cross-browser-tests-runner.org')
          }
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

      it('should run the script if a local url, valid values for all mandatory parameters, and local capability key are provided, and required tunnel process is started before creating the session', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://build.cross-browser-tests-runner.org:3000/tests/pages/tests.html', {
          browser: 'Chrome',
          browserVersion: '45.0',
          os: 'Windows',
          osVersion: '10'
        }, {
          build: build.build,
          test: build.test,
          project: build.project,
          localIdentifier: 'test-sj-tunnel'
        })
        var tunnel = new Tunnel({tunnelIdentifier: 'test-sj-tunnel'})
        var match, savedSource
        return tunnel.start()
        .then(() => {
          expect(tunnel).to.not.be.null
          expect(tunnel.process.pid).to.not.be.undefined
          expect(tunnel.process.tunnelId).to.not.be.undefined
          expect(tunnel.process.tunnelId).to.equal('test-sj-tunnel')
          return scriptJob.create()
        })
        .then(() => {
          return scriptJob.run(script)
        })
        .then(() => {
          return scriptJob.driver.getPageSource()
        })
        .then(source => {
          savedSource = source
          utils.log.debug(source)
          match = source.match(/<h1>Hi, this is a page for testing cross\-browser\-tests\-runner<\/h1>/)
          return scriptJob.driver.quit()
        })
        .then(() => {
          return utils.ensureZeroTunnels()
        })
        .then(() => {
          if(!match && !savedSource.match(/build.cross-browser-tests-runner.org<\/strong> refused to connect./)) {
            throw new Error('Did not get expected page source or the source hinting at tunnel failure')
          }
          return true
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

    })

    describe('markStatus', function(){

      this.timeout(0)

      it('should fail if session is not created yet', function() {
        var scriptJob = new ScriptJob('',{
          browser: 'Chrome',
          browserVersion: '45.0',
          os: 'Windows',
          osVersion: '10'
        })
        expect(()=>{scriptJob.markStatus()}).to.throw('Platforms.Core.ScriptJob: session not created yet to mark')
      })

      it('should be able to mark status even before running the script, as passed in case no decider function is provided', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Firefox',
          browserVersion: '37.0',
          os: 'Windows',
          osVersion: '8'
        }, {
          build: build.build,
          test: build.test,
          project: build.project
        })
        return scriptJob.create()
        .then(() => {
          return scriptJob.markStatus()
        })
        .then(() => {
          return scriptJob.stop()
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

      it('should mark status after running the script, as passed in case no decider is provided', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Chrome',
          browserVersion: '41.0',
          os: 'OS X',
          osVersion: 'El Capitan'
        }, {
          build: build.build,
          test: build.test,
          project: build.project
        })
        return scriptJob.create()
        .then(() => {
          return scriptJob.run(script)
        })
        .then(() => {
          return scriptJob.markStatus()
        })
        .then(() => {
          return scriptJob.stop()
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

      it('should mark status even if the session is already stopped', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Chrome',
          browserVersion: '35.0',
          os: 'Windows',
          osVersion: '7'
        }, {
          build: build.build,
          test: build.test,
          project: build.project
        })
        return scriptJob.create()
        .then(() => {
          return scriptJob.markStatus()
        })
        .then(() => {
          return scriptJob.stop()
        })
        .then(() => {
          return scriptJob.markStatus()
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

      it('should mark status after creating the session, as failed in case decider function throws an error', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Firefox',
          browserVersion: '36.0',
          os: 'OS X',
          osVersion: 'Mavericks'
        },{
          build: build.build,
          test: build.test,
          project: build.project
        })
        return scriptJob.create()
        .then(() => {
          return scriptJob.markStatus((driver, wd)=>{
            throw new Error('Random Error')
          })
        })
        .then(() => {
          return scriptJob.stop()
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

      it('should mark status after creating the session, as failed in case the decider promise is rejected', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Chrome',
          browserVersion: '40.0',
          os: 'Windows',
          osVersion: '8.1'
        },{
          build: build.build,
          test: build.test,
          project: build.project
        })
        return scriptJob.create()
        .then(() => {
          return scriptJob.markStatus((driver, wd)=>{
            return Promise.reject('Random Error')
          })
        })
        .then(() => {
          return scriptJob.stop()
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

      it('should mark status after creating the session, as failed in case the decider promise is resolved with a falsy result', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Firefox',
          browserVersion: '41.0',
          os: 'OS X',
          osVersion: 'El Capitan'
        },{
          build: build.build,
          test: build.test,
          project: build.project
        })
        return scriptJob.create()
        .then(() => {
          return scriptJob.markStatus((driver, wd)=>{
            return Promise.resolve(false)
          })
        })
        .then(() => {
          return scriptJob.stop()
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

      it('should mark status after creating the session, as passed in case the decider promise is resolved with a truthy result', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Chrome',
          browserVersion: '41.0',
          os: 'OS X',
          osVersion: 'Yosemite'
        },{
          build: build.build,
          test: build.test,
          project: build.project
        })
        return scriptJob.create()
        .then(() => {
          return scriptJob.markStatus((driver, wd)=>{
            return Promise.resolve(true)
          })
        })
        .then(() => {
          return scriptJob.stop()
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

    })

    describe('hasScreenshotOption', function() {

      this.timeout(0)

      it('should return false if screenshots option was not provided while creating', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Firefox',
          browserVersion: '39.0',
          os: 'Windows',
          osVersion: '8.1'
        }, {
          build: build.build,
          test: build.test,
          project: build.project
        })
        expect(scriptJob.hasScreenshotOption()).to.equal(false)
      })

      it('should return true if screenshots option was provided while creating', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Firefox',
          browserVersion: '39.0',
          os: 'Windows',
          osVersion: '8.1'
        }, {
          build: build.build,
          test: build.test,
          project: build.project,
          screenshots: true
        })
        expect(scriptJob.hasScreenshotOption()).to.equal(true)
      })

    })

    describe('screenshot', function() {

      this.timeout(0)

      function checkBase64(b64string) {
        var buf
        if (typeof Buffer.from === "function") {
          buf = Buffer.from(b64string, 'base64')
        } else {
          buf = new Buffer(b64string, 'base64')
        }
        var origLen = parseInt((b64string.length * 3) / 4),
          decodedLen = buf.toString().length
        utils.log.debug('original chars length %d', origLen)
        utils.log.debug('decoded chars length %d', decodedLen)
        expect(decodedLen).to.be.below(origLen + 1)
        expect(decodedLen).to.be.above(0)
      }

      it('should fail if the session is not created yet', function(){
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Chrome',
          browserVersion: '41.0',
          os: 'OS X',
          osVersion: 'Yosemite'
        },{
          build: build.build,
          test: build.test,
          project: build.project
        })
        expect(() => { return scriptJob.screenshot() }).to.throw('Platforms.Core.ScriptJob: session not created yet to take screenshot')
      })

      it('should be able to take a screenshot just after creating the session', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Chrome',
          browserVersion: '41.0',
          os: 'OS X',
          osVersion: 'Sierra'
        },{
          build: build.build,
          test: build.test,
          project: build.project
        })
        var pngStr
        return scriptJob.create()
        .then(() => {
          return scriptJob.screenshot()
        })
        .then((str) => {
          pngStr = str
          return scriptJob.stop()
        })
        .then(() => {
          checkBase64(pngStr)
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

      it('should be able to take a screenshot just after running the test script', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Firefox',
          browserVersion: '35.0',
          os: 'OS X',
          osVersion: 'Mavericks'
        },{
          build: build.build,
          test: build.test,
          project: build.project
        })
        var pngStr
        return scriptJob.create()
        .then(() => {
          return scriptJob.run(script)
        })
        .then(() => {
          return scriptJob.screenshot()
        })
        .then((str) => {
          pngStr = str
          return scriptJob.stop()
        })
        .then(() => {
          checkBase64(pngStr)
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

      it('should fail if the session is already stopped', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Firefox',
          browserVersion: '40.0',
          os: 'Windows',
          osVersion: '8'
        },{
          build: build.build,
          test: build.test,
          project: build.project
        })
        return scriptJob.create()
        .then(() => {
          return scriptJob.run(script)
        })
        .then(() => {
          return scriptJob.stop()
        })
        .then(() => {
          return scriptJob.screenshot()
        })
        .should.be.rejectedWith('This driver instance does not have a valid session ID')
      })

    })

    describe('status', function() {

      this.timeout(0)

      it('should fail if session is not created yet', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Chrome',
          browserVersion: '41.0',
          os: 'Windows',
          osVersion: '7'
        },{
          build: build.build,
          test: build.test,
          project: build.project
        })
        expect(() => { return scriptJob.status() }).to.throw('Platforms.Core.ScriptJob: session not created yet to get status')
      })

      it('should say "running" for a script job just after the session is created', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Chrome',
          browserVersion: '37.0',
          os: 'Windows',
          osVersion: '7'
        },{
          build: build.build,
          test: build.test,
          project: build.project
        })
        var status
        return scriptJob.create()
        .then(() => {
          return scriptJob.status()
        })
        .then(ret => {
          status = ret
          return scriptJob.stop()
        })
        .then(() => {
          expect(status).to.equal('running')
          return true
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

      it('should say "running" for a script job just after running the script', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Firefox',
          browserVersion: '39.0',
          os: 'Windows',
          osVersion: '8'
        },{
          build: build.build,
          test: build.test,
          project: build.project
        })
        var status
        return scriptJob.create()
        .then(() => {
          return scriptJob.run(script)
        })
        .then(() => {
          return scriptJob.status()
        })
        .then(ret => {
          status = ret
          return scriptJob.stop()
        })
        .then(() => {
          expect(status).to.equal('running')
          return true
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

      it('should say "stopped" for a non-existent session (simulated by replacing a working script job session with an invalid one)', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Chrome',
          browserVersion: '45.0',
          os: 'OS X',
          osVersion: 'Yosemite'
        },{
          build: build.build,
          test: build.test,
          project: build.project
        })
        var status
        return scriptJob.create()
        .then(() => {
          scriptJob.session = 'abc'
          return scriptJob.run(script)
        })
        .then(() => {
          return scriptJob.status()
        })
        .then(ret => {
          status = ret
          return scriptJob.stop()
        })
        .then(() => {
          expect(status).to.equal('stopped')
          return true
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

      it('should say "stopped" for a script job once the session was created and stopped', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Firefox',
          browserVersion: '44.0',
          os: 'OS X',
          osVersion: 'El Capitan'
        },{
          build: build.build,
          test: build.test,
          project: build.project
        })
        var status
        return scriptJob.create()
        .then(() => {
          return scriptJob.stop()
        })
        .then(() => {
          return scriptJob.status()
        })
        .then(ret => {
          status = ret
          expect(status).to.equal('stopped')
          return true
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

      it('should say "stopped" for a script job that was marked as passed', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Firefox',
          browserVersion: '34.0',
          os: 'Windows',
          osVersion: '8'
        },{
          build: build.build,
          test: build.test,
          project: build.project
        })
        var status
        return scriptJob.create()
        .then(() => {
          return scriptJob.markStatus()
        })
        .then(() => {
          return scriptJob.stop()
        })
        .then(() => {
          return scriptJob.status()
        })
        .then(status => {
          expect(status).to.equal('stopped')
          return true
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

      it('should say "stopped" for a script job that was marked as failed', function() {
        var build = utils.buildDetails()
        var scriptJob = new ScriptJob('http://www.google.com', {
          browser: 'Chrome',
          browserVersion: '40.0',
          os: 'Windows',
          osVersion: '8'
        },{
          build: build.build,
          test: build.test,
          project: build.project
        })
        var status
        return scriptJob.create()
        .then(() => {
          return scriptJob.markStatus(()=>{
            return Promise.resolve(false)
          })
        })
        .then(() => {
          return scriptJob.stop()
        })
        .then(() => {
          return scriptJob.status()
        })
        .then(status => {
          expect(status).to.equal('stopped')
          return true
        })
        .catch(err => {
          utils.log.error('error: ', err)
          throw err
        })
        .should.be.fulfilled
      })

    })

  })

}
