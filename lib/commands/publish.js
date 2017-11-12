'use strict';

const Async = require('neo-async');
const Fs = require('fs');
const Github = require('github');
const Log = require('npmlog');
const Mkdirp = require('mkdirp');
const Path = require('path');
const Zlib = require('zlib');



const uploadAssets = (path, github, opts, cb) => {

    //  repo, release.id, owner, filename, filepath
    
    Fs.readdir(path, (err, files) => {
     
        if (err) {
            return cb(err);
        }

        const iterator = (file, next) => {

            opts.name = file;
            opts.filePath = Path.join(path, file);
            
            github.repos.uploadAsset(opts, (err) => {

                if(err) {
                    return next(err);
                };
                return next(null);
            });
        };

        Async.each(files, iterator, cb);
    });


};

module.exports = (opts, cb) => {

    const tarball = opts.stagedTarball;

    const githubApi = new Github({ // set defaults
        // required
        version: "3.0.0",
        // optional
        debug: false,
        protocol: "https",
        host: "api.github.com",
        pathPrefix: "", // for some GHEs; none for GitHub
        timeout: 5000,
        headers: {}
    });

    if(!opts.repository) {
        return cb(new Error('Missing repository.url in package.json'), null);
    }

    let ownerRepo = opts.repository.match(/github\.com\/(.*)(?=\.git)/i);
    if (!ownerRepo) {
        return cb(new Error('A correctly formatted GitHub repository.url was not found within package.json'), null);

    }

    ownerRepo = ownerRepo[1].split('/');
    const owner = ownerRepo[0];
    const repo = ownerRepo[1];
    
    const githubOpts = {
        owner,
        repo,
        tag_name: opts.version,
		target_commitish: 'master',
		name: `v${opts.version}`,
		body: `${opts.moduleName} ${opts.version}`,
		draft: true,
		prerelease: false
    };

    const token = process.env.NODE_PRE_GYP_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
	if(!token) {
        return cb(new Error('Environment variable for github token not found, locations checked where NODE_PRE_GYP_GITHUB_TOKEN and GITHUB_TOKEN', null));
    }

	githubApi.auth = {
        token,
        type: 'oauth'
    };

    Fs.exists(tarball, (found) => {

        if (!found) {
            return cb(new Error(`Cannot publish because ${tarball} missing: run "pre-cmake-js package" first`), null);
        }

        githubApi.repos.getReleases({ owner, repo }, (err, releases) => {

            if (err) {
                return cb(err, null);
            };

            const filterReleases = () => {

                return releases.data.filter((element) => {
                        
                    return element.tag_name === opts.version;
                });
            };

            const filteredReleases = filterReleases();
           

            if (filteredReleases.length === 0) {

                Log.info('publish', `Creating release v${opts.version} as none found`);

                githubApi.repos.createRelease(githubOpts, (err, release) => {

                    if (err) {
                        return cb(err, null);
                    }
                    
                    
                    Log.info('publish', `Created draft release v${opts.version}`);
                    const assetsOpts = { repo, id: release.id, owner };
                    uploadAssets(opts.stagedPath, githubApi, assetsOpts, cb);
                });
            } 
            else {
                const release = filteredReleases[0];
                Log.info('publish', `Found release id ${release.id}`);
                const assetsOpts = { repo, id: release.id, owner };
                uploadAssets(opts.stagedPath, githubApi, assetsOpts, cb);
            }
        });
    });
};
