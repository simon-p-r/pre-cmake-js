'use strict';

const Log = require('npmlog');
const Utils = require('../utils');

module.exports = (opts, cb) => {
    
    const finalArgs = Utils.argsBuilder('compile', opts);
    Utils.runCMakejs(finalArgs, opts, cb);
};