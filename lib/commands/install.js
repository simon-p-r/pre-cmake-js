'use strict';

const Fs = require('fs');
const Path = require('path');
const Zlib = require('zlib');
const Log = require('npmlog');

const Utils = require('../utils');

const download = (uri, opts, next) => {

    Log.http('GET', uri);

    let req = null;

    // Try getting version info from the currently running npm.
    const envVersionInfo = process.env.npm_config_user_agent ||
        'node ' + process.version;

    const requestOpts = {
        uri: uri.replace('+','%2B'),
        headers: {
            'User-Agent': 'pre-cmake-js (v' + opts.version + ', ' + envVersionInfo + ')'
        }
    };

    if (opts.cafile) {
        try {
            requestOpts.ca = Fs.readFileSync(opts.cafile);
        }
        catch (e) {
            return next(e);
        }
    }
    else if (opts.ca) {
        requestOpts.ca = opts.ca;
    }

    const proxyUrl = opts.proxy ||
                    process.env.http_proxy ||
                    process.env.HTTP_PROXY ||
                    process.env.npm_config_proxy;

    if (proxyUrl) {
        if (/^https?:\/\//i.test(proxyUrl)) {
            Log.verbose('download', 'using proxy url: "%s"', proxyUrl);
            requestOpts.proxy = proxyUrl;
        }
        else {
            Log.warn('download', 'ignoring invalid "proxy" config setting: "%s"', proxyUrl);
        }
    }

    try {
        req = require('request')(requestOpts);
    }
    catch (e) {
        return next(e);
    }

    if (req) {
        req.on('response', (res) => {

            Log.http(res.statusCode, uri);
        });
    };

    return next(null, req);
};

const installBinary = (from, to, opts, next) => {

    download(from, opts, (err, req) => {

        if (err) {
            return next(err);
        }

        if (!req) {
            return next(new Error('empty req'), null);
        }

        let badDownload = false;
        let extractCount = 0;
        const gunzip = Zlib.createGunzip();
        const extracter = require('tar').extract({ cwd: to, strip: 1 });

        const afterTarball = (err) => {

            if (err) {
                return next(err);
            }
            if (badDownload) {
                return next(new Error('bad download'));
            }
            if (extractCount === 0) {
                return next(new Error('There was a fatal problem while downloading/extracting the tarball'));
            }
            Log.info('tarball', 'done parsing tarball');
            return next();
        };

        const filter_func = (entry) => {

            // ensure directories are +x
            // https://github.com/mapnik/node-mapnik/issues/262
            entry.mode |= (entry.mode >>> 2) & parseInt('0111',8);
            Log.info('install','unpacking ' + entry.path);
            extractCount++;
        };

        gunzip.on('error', next);
        extracter.on('entry', filter_func);
        extracter.on('error', next);
        extracter.on('end', afterTarball);

        req.on('error', (err) => {

            badDownload = true;
            return next(err);
        });

        req.on('close', () => {

            if (extractCount === 0) {
                return next(new Error('Connection closed while downloading tarball file'));
            };
        });

        req.on('response', (res) => {

            if (res.statusCode !== 200) {
                badDownload = true;
                const err = new Error(res.statusCode + ' status code downloading tarball ' + from);
                err.statusCode = res.statusCode;
                return next(err);
            };
            // start unzipping and untaring
            req.pipe(gunzip).pipe(extracter);
        });
    });
};


const printFallbackError = (err, opts) => {

    const fallback_message = ' (falling back to source compile with node-gyp)';
    let full_message = '';
    if (err.statusCode !== undefined) {
        // If we got a network response it but failed to download
        // it means remote binaries are not available, so let's try to help
        // the user/developer with the info to debug why
        full_message = 'Pre-built binaries not found for ' + opts.moduleName + '@' + opts.version;
        full_message += ' and ' + opts.runtime + '@' + (opts.target || process.versions.node) + ' (' + opts.nodeAbi + ' ABI, ' + opts.libc + ')';
        full_message += fallback_message;
        Log.error('Tried to download(' + err.statusCode + '): ' + opts.hostedTarball);
        Log.error(full_message);
        Log.http(err.message);
    }
    else {
        // If we do not have a statusCode that means an unexpected error
        // happened and prevented an http response, so we output the exact error
        full_message = 'Pre-built binaries not installable for ' + opts.moduleName  + '@' + opts.version;
        full_message += ' and ' + opts.runtime + '@' + (opts.target || process.versions.node) + ' (' + opts.nodeAbi + ' ABI, ' + opts.libc + ')';
        full_message += fallback_message;
        Log.error(full_message);
        Log.error('Hit error ' + err.message);
    };
};

module.exports = (options, cb) => {

    const sourceBuild = options.buildFromSource;
    const updateBinary = options.updateBinary;
    const doSourceBuild = (sourceBuild === true || sourceBuild === 'true');
    if (doSourceBuild) {
        Log.info('build','requesting source compile');
        const finalArgs = Utils.argsBuilder('build', options);
        return Utils.runCMakejs(finalArgs, options, cb);
    }

    const fallbackToBuild = options.fallbackToBuild;
    const doFallbackToBuild = (fallbackToBuild === true || fallbackToBuild === 'true');
    const from = options.hostedTarball;
    const to = options.modulePath;
    const binaryModule = Path.join(to, options.moduleName + '.node');

    Fs.exists(binaryModule, (found) => {

        if (found && !updateBinary) {
            Log.info(`[${options.moduleName}] Success: "${binaryModule}" already installed`);
            Log.info('Pass --update-binary to reinstall or --build-from-source to recompile');
            return cb();
        }

        if (!updateBinary) {
            Log.info('check','checked for "' + binaryModule + '" (not found)');
        }

        installBinary(from, to, options, (err) => {

            if (err && doFallbackToBuild) {
                printFallbackError(err, options);
                return doBuild(cmake, options, cb);
            }
            else if (err) {
                return cb(err);
            }

            Log.info('[' + options.moduleName + '] Success: "' + options.modulePath + '" is installed via remote');
            return cb();
        });
    });
};


