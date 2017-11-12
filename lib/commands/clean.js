'use strict';

const Fs = require('fs');
const Log = require('npmlog');
const Path = require('path');
const Rmdir = require('rimraf');

module.exports = (opts, cb) => {

    const toDelete = Path.join(opts.directory, 'build');
    Log.info('clean', `Cleaning directory name ${toDelete}`);
    Fs.exists(toDelete, (exists) => {

        if (exists) {
            Rmdir(toDelete, (err) => {

                if (err) {
                    return cb(err, null);
                }

                return cb(null, 'Directory cleaned');
            });
        }
        else {
            return cb(null, 'Directory not deleted as it does not exist');
        }
    });
};
