# pre-cmake-js

[![Windows Build Status](https://img.shields.io/appveyor/ci/simon-p-r/pre-cmake-js/master.svg?label=windows&style=flat-square&maxAge=2592000)](https://ci.appveyor.com/project/simon-p-r/pre-cmake-js)
[![Current Version](https://img.shields.io/npm/v/pre-cmake-js.svg?maxAge=1000)](https://www.npmjs.org/package/pre-cmake-js)
[![dependency Status](https://img.shields.io/david/simon-p-r/pre-cmake-js.svg?maxAge=1000)](https://david-dm.org/simon-p-r/pre-cmake-js)
[![devDependency Status](https://img.shields.io/david/dev/simon-p-r/pre-cmake-js.svg?maxAge=1000)](https://david-dm.org/simon-p-r/pre-cmake-js)

pre-cmake-js - a cmake equivalent to pre-node-gyp

WIP project needs further testing


# Install

```bash
$ npm install -g pre-cmake-js
```

# Usage


```js
pre-cmake-js [command] <options>
```

Following commands have been basically implemented

- build - configures and invokes build files
- clean - deletes build direectory
- compile - compiles confgiured build files
- configure - configure build files
- install - instal binary, similar to node-pre-gyp options
- package - create tarball of compiled binary
- rebuild - deletes build folder, confgiures and builds project
- reconfigure - reconfigure build files


Todo

* add tests
* allow configurable binary hosts, currently only supports Github releases
* allow using 3rd party modules for bindings modules

