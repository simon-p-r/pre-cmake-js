'use strict';

// options are 
// --build-from-source
// --fallback-to-build
// --target_platform=win32
// --target_arch=ia32
// --update-binary

const Path = require('path');
const Url = require('url');

const Log = require('npmlog');

const Commands = require('./commands');

const internals = {};

const requiredPkgKeys = ['binary', 'cmake-js', 'name', 'main', 'version', 'repository'];
const cmdLineArgs = [
    'log-level', 
    'debug', 
    'directory', 
    'runtime', 
    'runtime-version', 
    'arch', 
    'defines', 
    'out', 
    'build-from-source', 
    'fallback-to-build', 
    'update-binary', 
    'silent',
    'cMakeOptions'
];


internals.mergeOptions = (opts) => {

    // read local vars first then merge command line params over top
    // TODO read global vars first
    const merged = {};
    const modulePkgPath = Path.join(opts.directory, 'package.json');
    const modulePkg = require(modulePkgPath);
    const pkgKeys = Object.keys(modulePkg);

    for (let i = 0; i < pkgKeys.length; ++i) {
        const pkgKey = pkgKeys[i];
        if (~requiredPkgKeys.indexOf(pkgKey)) {
            const pkgVal = modulePkg[pkgKey];
            if (pkgVal) {

                if (pkgKey === 'name') {
                    merged.moduleName = pkgVal;
                }
                else if (pkgKey === 'cmake-js') {
                    if (pkgVal.runtime ) {
                        merged.runtime = pkgVal.runtime;
                    }
                    if (pkgVal.runtimeVersion) {
                        merged.runtimeVersion = pkgVal.runtimeVersion;
                    }

                    if (pkgVal.arch) {
                        merged.arch = pkgVal.arch;
                    }
                }
                else if (pkgKey === 'binary') {

                    if (pkgVal.module_name ) {
                        merged.moduleName = pkgVal.module_name;
                    }
                    if (pkgVal.package_name) {
                        merged.pkgName = pkgVal.package_name;
                    }

                    if (pkgVal.remote_path) {
                        merged.remotePath = pkgVal.remote_path;
                    }

                    if (pkgVal.host) {
                        merged.host = pkgVal.host;
                    }
                }

                else if (pkgKey === 'repository') {
                    merged.repository = pkgVal.url;
                }
                else {
                    merged[pkgKey] = pkgVal;
                }
            };
        };
    };

    const cmdLineKeys = Object.keys(opts);

    for (let i = 0; i < cmdLineKeys.length; ++i) {
        const cmdKey = cmdLineKeys[i];
        if (~cmdLineArgs.indexOf(cmdKey)) {
            const cmdVal = opts[cmdKey];
            if (cmdVal) {
                if (cmdKey === 'runtime-version') {
                    merged.runtimeVersion = cmdVal;
                }
                else if (cmdKey === 'build-from-source') {
                    merged.buildFromSource = cmdVal;
                }
                else if (cmdKey === 'fallback-to-build') {
                    merged.fallBackToBuild = cmdVal;
                }
                else if (cmdKey === 'update-binary') {
                    merged.updateBinary = cmdVal;
                }
                else if (cmdKey === 'log-level') {
                    merged.logLevel = cmdVal;
                }
                else {
                    merged[cmdKey] = cmdVal;
                }
            };
        };
    };

    merged.configuration = merged.debug ? 'Debug' : 'Release';
    return merged;
};

exports.execute = (command, args, cb) => {

    const cmdOpts = args;

    if (cmdOpts.directory) {
        cmdOpts.directory = Path.resolve(cmdOpts.directory);
    }
    else {
        cmdOpts.directory = process.cwd();
    }

    const mergedOpts = internals.mergeOptions(cmdOpts);

    // if (mergedOpts.module_root) {
    //     // resolve relative to known module root: works for pre-binding require
    //     opts.module_path = path.join(options.module_root, opts.module_path);
    // } else {
    //     // resolve relative to current working directory: works for node-pre-gyp commands
    //     opts.module_path = path.resolve(opts.module_path);
    // }

    // very messy code here TODO
    if (!mergedOpts.platform) {
        mergedOpts.platform = process.platform;
    }

    if (!mergedOpts.arch) {
        mergedOpts.arch = process.arch;
    }

    const defaultRemotePath = `${mergedOpts.moduleName}-v${mergedOpts.version}-${mergedOpts.platform}-${mergedOpts.arch}.tar.gz`;

    if (!mergedOpts.packageName) {
        mergedOpts.packageName = defaultRemotePath;
    };

    if (!mergedOpts.modulePath) {
        mergedOpts.modulePath = Path.join(mergedOpts.directory, 'build', mergedOpts.configuration);
    }

    if (!mergedOpts.runtime) {
        mergedOpts.runtime = 'node';
    }

    if (!mergedOpts.runtimeVersion) {
        mergedOpts.runtimeVersion = process.versions.node;
    }


    mergedOpts.module = Path.join(mergedOpts.modulePath, mergedOpts.moduleName + '.node');
    mergedOpts.remotePath = mergedOpts.remotePath ? mergedOpts.remotePath : defaultRemotePath;
    mergedOpts.hostedPath = Url.resolve(mergedOpts.host, mergedOpts.remotePath);
    mergedOpts.hostedTarball = Url.resolve(mergedOpts.hostedPath, mergedOpts.packageName);
    mergedOpts.stagedPath = Path.join(mergedOpts.directory, 'build', 'stage');
    mergedOpts.stagedTarball = Path.join(mergedOpts.stagedPath, mergedOpts.remotePath);

    const cmakeCmd = Commands[command];
    if (!cmakeCmd) {
         return cb(new Error('Invalid command'), null);
    }
    cmakeCmd(mergedOpts, (err, response) => {

        if (err) {
 
            return cb(err);
        }
        return cb(null, response);
    });

};



