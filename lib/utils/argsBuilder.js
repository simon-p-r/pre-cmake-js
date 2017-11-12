'use strict';

module.exports = (cmd, opts) => {
    
    const args = [cmd];
    
    if (opts.arch) {
        args.push('--arch');
        args.push(opts.arch);
    };

    if (opts.logLevel) {
        args.push('--log-level');
        args.push(opts.logLevel);
    };

    if (opts.debug) {
        args.push('-D');
    };

    if(opts.directory) {
        args.push('--directory');
        args.push(opts.directory);
    };

    if(opts.runtime) {
        args.push('--runtime');
        args.push(opts.runtime);
    };

    if(opts.runtimeVersion) {
        args.push('--runtime-version');
        args.push(opts.runtimeVersion);
    };

    if (opts.silent) {
        args.push('--silent');
    };

    if(opts.generator) {
        args.push('-G');
        args.push(opts.generator);
    };

    if(opts.cMakeOptions) {
        const keys = Object.keys(opts.cMakeOptions);
        keys.forEach((key) => {

            const val = opts.cMakeOptions[key];
            if (opts.cMakeOptions[key]) {
                args.push(`--CD${key}=${val}`);
            }
            
        });
    };

    return args;
  
};