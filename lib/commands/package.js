'use strict';

const Fs = require('fs');
const Path = require('path');
const Zlib = require('zlib');
const Log = require('npmlog');
const Mkdirp = require('mkdirp');


module.exports = (opts, cb) => {

    const pack = require('tar-pack').pack;
    const from = opts.modulePath;
    const binaryModule = Path.join(from, opts.moduleName + '.node');
    Fs.exists(binaryModule, (found) => {

        if (!found) {
            return cb(new Error(`Cannot package because ${binaryModule} missing: run "pre-cmake-js rebuild" first`));
        }

        const tarball = opts.stagedTarball;
        const filterFunc = (entry) => {
            // ensure directories are +x
            // https://github.com/mapnik/node-mapnik/issues/262
            Log.info('package','packing ' + entry.path);
            return true;
        };

        Mkdirp(Path.dirname(tarball), (err) => {

            if (err) {
                throw err;
            }
            pack(from, { filter: filterFunc })
                .pipe(Fs.createWriteStream(tarball))
                .on('error', (err) => {

                    if (err) {
                        console.error(`[${opts.moduleName}] ${err.message}`);
                    } 
                    return cb(err);
                })
                .on('close', () => {
                    
                    Log.info('package','Binary staged at "' + tarball + '"');
                    return cb();
                });
        });
    });
};



