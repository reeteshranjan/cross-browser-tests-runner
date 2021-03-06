'use strict';

let
  fs = require('fs'),
  TunnelInterface = require('./../interfaces/tunnel').Tunnel

class Tunnel extends TunnelInterface {

  constructor(OptionsClass, ProcessClass, ExeClass, tunnelIdArg, settings, proc) {
    super()
    this.settings = settings || { }
    this.options = new OptionsClass(this.settings)
    this.process = proc || new ProcessClass(undefined, settings && settings[tunnelIdArg])
    this.exe = new ExeClass()
  }

  start() {
    if (this.process.pid && 'running' === this.process.status()) {
      throw new Error('Platforms.Core.Tunnel: already started with pid ' + this.process.pid)
    }
  }

  stop() {
    return this.process.stop()
  }

  status() {
    return this.process.status()
  }

  restart() {
    return this.stop()
    .catch(err => {
      if(err.message.match(/already stopped/)) {
        return Promise.resolve(true)
      }
      throw err
    })
    .then(() => {
      return this.start()
    })
  }

  check(input) {
    return this.options.process(input)
  }

  exists() {
    return this.exe.exists()
  }

  fetch() {
    return this.exe.fetch()
  }

  fetchArchive() {
    return this.exe.fetch()
    .then(() => {
      if(!fs.existsSync(this.exe.binary)) {
        return this.exe.extract()
      }
      return Promise.resolve(true)
    })
  }

  remove() {
    return this.exe.remove()
  }

}

exports.Tunnel = Tunnel
