global.Promise = global.Promise || require('bluebird')

var
  path = require('path'),
  settings = require('./../../../../../bin/server/settings')(path.resolve(process.cwd(), 'tests/integration/conf/native/cbtr.json')),
  utils = require('./../../utils'),
  chai = require('chai'),
  chaiHttp = require('chai-http'),
  chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
chai.use(chaiHttp)

var
  expect = chai.expect,
  should = chai.should(),
  request = chai.request,
  host = 'http://' + settings.server.host + ':' + settings.server.port

describe('/', function() {

  this.timeout(0)

  it('should fail with 404 status code for GET method', function() {
    return request(host)
      .get('/cbtr')
      .catch(err => {
        expect(err.status).to.equal(404)
        return true
      })
      .catch(err => {
        utils.log.error('error: ', err)
        throw err
      })
      .should.be.fulfilled
  })

  it('should fail with 404 status code for POST method', function() {
    return request(host)
      .post('/cbtr')
      .catch(err => {
        expect(err.status).to.equal(404)
        return true
      })
      .catch(err => {
        utils.log.error('error: ', err)
        throw err
      })
      .should.be.fulfilled
  })
})

describe('/run', function() {

  this.timeout(0)

  it('should fail with 404 status code for GET method', function() {
    return request(host)
      .get('/cbtr/run')
      .catch(err => {
        expect(err.status).to.equal(404)
        return true
      })
      .catch(err => {
        utils.log.error('error: ', err)
        throw err
      })
      .should.be.fulfilled
  })

  it('should work for POST method even without any parameters', function() {
    return request(host)
      .post('/cbtr/run')
      .catch(err => {
        utils.log.error('error: ', err)
        throw err
      })
      .should.be.fulfilled
  })

})

describe('/coverage', function() {

  this.timeout(0)

  it('should fail with 404 status code for GET method', function() {
    return request(host)
      .get('/cbtr/coverage')
      .catch(err => {
        expect(err.status).to.equal(404)
        return true
      })
      .catch(err => {
        utils.log.error('error: ', err)
        throw err
      })
      .should.be.fulfilled
  })

  it('should work for POST method even without any parameters', function() {
    return request(host)
      .post('/cbtr/coverage')
      .catch(err => {
        utils.log.error('error: ', err)
        throw err
      })
      .should.be.fulfilled
  })

})

