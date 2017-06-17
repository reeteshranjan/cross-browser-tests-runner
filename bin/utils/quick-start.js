#!/usr/bin/env node

'use strict'

const
  allowedOptions = [ 'platform', 'runner', 'help' ],
  allowedPlatforms = [ 'browserstack' ],
  allowedRunners = [ 'testem' ]

let
  path = require('path'),
  utils = require('./../utils'),
  args = (require('minimist')(process.argv.slice(2), {
    string: ['platform', 'runner'],
    boolean: ['help'],
    alias: {platform: 'p', runner: 'r', help: 'h'},
    unknown: opt => {
      return utils.onUnknownOpt(-1 !== allowedOptions.indexOf(opt), opt, help)
    }
  }))

function help() {
  console.log(
    '\n' +
    path.basename(process.argv[1]) +
    ' [--help|-h] [--platform|-p <cross-browser platform>] [--runner|-o <tests-runner>]\n\n' +
    'Options:\n' +
    ' help              print this help\n' +
    ' platform          browserstack\n' +
    ' runner            testem'
  )
}

utils.handleHelp(args, help)

if(!args.platform) {
  console.error('No platform specified')
  args.help = true
}
else if(-1 === allowedPlatforms.indexOf(args.platform)) {
  console.error('Unknown platform: %s', args.platform)
  args.help = true
}

if(!args.runner) {
  console.error('No runner specified')
  args.help = true
}
else if(-1 === allowedRunners.indexOf(args.runner)) {
  console.error('Unknown runner: %s', args.runner)
  args.help = true
}

utils.handleHelp(args, help)

let
  Process = require('./../../lib/core/process').Process

/* eslint-disable no-process-exit */

let proc = new Process()
console.log('Updating browsers for platform: %s', args.platform)
proc.create('node', [path.resolve(__dirname, 'conf/browsers/' + args.platform + '.js')], {
  onstderr: err => {
    console.error('Unexpected error while updating browsers: %s', err)
    process.exit(1)
  }
})
.then(() => {
  console.log('Creating global cross-browser-tests-runner settings from sample browsers for %s', args.platform)
  proc = new Process()
  return proc.create('node', [path.resolve(__dirname, 'settings/cbtr.js'), '--input', path.resolve(__dirname, '../../samples/.cbtr-browsers-' + args.platform + '.yml')], {
    onstderr: err => {
      console.error('Unexpected error while creating CBTR settings: %s', err)
      process.exit(1)
    }
  })
})
.then(() => {
  console.log('Creating %s config for %s platform using cross-browser-tests-runner settings', args.runner, args.platform)
  proc = new Process()
  return proc.create('node', [path.resolve(__dirname, 'settings/' + args.runner + '/' + args.platform + '.js')], {
    onstderr: err => {
      console.error('Unexpected error while creating runner config: %s', err)
      process.exit(1)
    },
    onstdout: out => {
      if(out.match(/Are you using multiple tunnels with different identifiers/)) {
        proc.proc.stdin.write('y\n')
      }
      else if(out.match(/Do you need to take screenshots of your tests once completed/)) {
        proc.proc.stdin.write('y\n')
      }
      else if(out.match(/Do you need to take video of your test/)) {
        proc.proc.stdin.write('y\n')
      }
    }
  })
})
.then(() => {
  console.log('Done! Run "npm start" and then execute your %s tests after specifying the test files and other required details in the runner config', args.runner)
})
.catch(err => {
  console.error('Unexpected error in quick start for platform "' + args.platform + '", runner "' + args.runner + '" %s', err)
})

/* eslint-enable no-process-exit */
