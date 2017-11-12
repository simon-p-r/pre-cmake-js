'use strict';

const ChildProcess = require('child_process');
const Fs = require('fs');
const Os = require('os');
const Path = require('path');

const Code = require('code');
const Lab = require('lab');

// Declare internals

const internals = {};

const Cli = require('../lib');
// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('bin/pre-cmake-js', () => {

    it('runs pre-cmake-js', () => {

        const preCMakeJS = Path.join(__dirname, '..', 'bin', 'pre-cmake-js');

        const spawned = ChildProcess.spawn('node', [preCMakeJS]);
        spawned.stdout.on('data', (data) => {

            expect(data.toString()).to.equal('loaded\n');
            console.log(data.toString());
            spawned.kill();
        });

        spawned.stderr.on('data', (data) => {

            expect(data.toString()).to.not.exist();
        });
    });

});

