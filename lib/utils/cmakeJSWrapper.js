'use strict';

const CP = require('child_process');
const Fs = require('fs');
const Path = require('path');


const internals = {};

internals.win = process.platform === 'win32';

internals.whichCMakejs = () => {

    let cmakejsBin;
    if (process.env.npm_config_cmakejs) {
        try {
            cmakejsBin = process.env.npm_config_cmakejs;
            if (Fs.existsSync(cmakejsBin)) {
                return cmakejsBin;
            }
        }
        catch (err) { }
    }
    try {
        const cmakejsMain = require.resolve('cmake-js');
        cmakejsBin = Path.join(Path.dirname(Path.dirname(cmakejsMain)), 'bin/cmake-js');
        if (Fs.existsSync(cmakejsBin)) {
            return cmakejsBin;
        }
    }
    catch (err) { }
};

module.exports = (args, opts, next) => {

    let shellCmd = '';
    const cmdArgs = [];
    if (opts.runtime && opts.runtime === 'node-webkit') {
        shellCmd = 'nw-cmake-js';
        if (internals.win) {
            shellCmd += '.cmd';
        }
    }
    else {
        const cmakejsPath = internals.whichCMakejs();
        if (cmakejsPath) {
            shellCmd = process.execPath;
            cmdArgs.push(cmakejsPath);
        }
        else {
            shellCmd = 'cmake-js';
            if (internals.win) {
                shellCmd += '.cmd';
            }
        }
    }
    const finalArgs = cmdArgs.concat(args);
    console.log(finalArgs);
    const cmd = CP.spawn(shellCmd, finalArgs, { cwd: undefined, env: process.env, stdio: [0, 1, 2] });
    cmd.on('error', (err) => {

        if (err) {
            return next(new Error('Failed to execute ' + shellCmd + ' ' + finalArgs.join(' ') + '" (' + err + ')"'), null);
        }
        return next(null, opts);
    });

    cmd.on('close', (code) => {

        if (code && code !== 0) {
            return next(new Error('Failed to execute ' + shellCmd + ' ' + finalArgs.join(' ') + '" (' + code + ')"'), null);
        }
        return next(null, opts);
    });
};
