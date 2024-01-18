"use strict";
(self["webpackChunk_jupyterlite_xeus"] = self["webpackChunk_jupyterlite_xeus"] || []).push([["lib_index_js"],{

/***/ "./lib/index.js":
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jupyterlite_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlite/server */ "webpack/sharing/consume/default/@jupyterlite/server");
/* harmony import */ var _jupyterlite_server__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_server__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlite_contents__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlite/contents */ "webpack/sharing/consume/default/@jupyterlite/contents");
/* harmony import */ var _jupyterlite_contents__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_contents__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlite/kernel */ "webpack/sharing/consume/default/@jupyterlite/kernel");
/* harmony import */ var _jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _web_worker_kernel__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./web_worker_kernel */ "./lib/web_worker_kernel.js");
// Copyright (c) Thorsten Beier
// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.




const EXTENSION_NAME = 'xeus';
const EXTENSION_STATIC_DIR = `../extensions/@jupyterlite/${EXTENSION_NAME}/static/`;
// helper function to fetch json
function getPkgJson(url) {
    const json_url = EXTENSION_STATIC_DIR + url;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', json_url, false);
    xhr.send(null);
    return JSON.parse(xhr.responseText);
}
let kernel_dir = [];
try {
    kernel_dir = getPkgJson('share/jupyter/kernels.json');
}
catch (err) {
    console.log(err);
    console.log('could not fetch share/jupyter/kernels/kernels.json');
    kernel_dir = [];
    throw err;
}
console.log(kernel_dir);
// fetch kernel spec for each kernel
const kernel_specs = kernel_dir.map(kernel_dir => {
    const spec = getPkgJson('share/jupyter/kernels/' + kernel_dir + '/kernel.json');
    spec.name = kernel_dir;
    spec.dir = kernel_dir;
    spec.resources = {
        'logo-32x32': EXTENSION_STATIC_DIR +
            'share/jupyter/kernels/' +
            kernel_dir +
            '/logo-32x32.png',
        'logo-64x64': EXTENSION_STATIC_DIR +
            'share/jupyter/kernels/' +
            kernel_dir +
            '/logo-64x64.png'
    };
    return spec;
});
console.log(kernel_specs);
const server_kernels = kernel_specs.map(kernelspec => {
    const server_kernel = {
        // use name from spec
        id: `@jupyterlite/${kernelspec.name}-extension:kernel`,
        autoStart: true,
        requires: [_jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_2__.IKernelSpecs],
        optional: [_jupyterlite_server__WEBPACK_IMPORTED_MODULE_0__.IServiceWorkerManager, _jupyterlite_contents__WEBPACK_IMPORTED_MODULE_1__.IBroadcastChannelWrapper],
        activate: (app, kernelspecs, serviceWorker, broadcastChannel) => {
            kernelspecs.register({
                spec: kernelspec,
                create: async (options) => {
                    // const mountDrive = !!(
                    //   serviceWorker?.enabled && broadcastChannel?.enabled
                    // );
                    const mountDrive = false;
                    if (mountDrive) {
                        console.info(`${kernelspec.name} contents will be synced with Jupyter Contents`);
                    }
                    else {
                        console.warn(`${kernelspec.name} contents will NOT be synced with Jupyter Contents`);
                    }
                    return new _web_worker_kernel__WEBPACK_IMPORTED_MODULE_3__.WebWorkerKernel({
                        ...options,
                        mountDrive,
                        kernelspec
                    });
                }
            });
        }
    };
    return server_kernel;
});
const plugins = server_kernels;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugins);


/***/ }),

/***/ "./lib/web_worker_kernel.js":
/*!**********************************!*\
  !*** ./lib/web_worker_kernel.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   WebWorkerKernel: () => (/* binding */ WebWorkerKernel)
/* harmony export */ });
/* harmony import */ var comlink__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! comlink */ "webpack/sharing/consume/default/comlink/comlink");
/* harmony import */ var comlink__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(comlink__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _lumino_signaling__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @lumino/signaling */ "webpack/sharing/consume/default/@lumino/signaling");
/* harmony import */ var _lumino_signaling__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_lumino_signaling__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @lumino/coreutils */ "webpack/sharing/consume/default/@lumino/coreutils");
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_lumino_coreutils__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_3__);
// Copyright (c) Thorsten Beier
// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.




class WebWorkerKernel {
    /**
     * Instantiate a new WebWorkerKernel
     *
     * @param options The instantiation options for a new WebWorkerKernel
     */
    constructor(options) {
        this._isDisposed = false;
        this._disposed = new _lumino_signaling__WEBPACK_IMPORTED_MODULE_1__.Signal(this);
        this._executeDelegate = new _lumino_coreutils__WEBPACK_IMPORTED_MODULE_2__.PromiseDelegate();
        this._parentHeader = undefined;
        this._parent = undefined;
        console.log('constructing WebWorkerKernel kernel');
        const { id, name, sendMessage, location } = options;
        this._id = id;
        this._name = name;
        this._location = location;
        this._kernelspec = options.kernelspec;
        this._sendMessage = sendMessage;
        console.log('constructing WebWorkerKernel worker');
        this._worker = new Worker(new URL(/* worker import */ __webpack_require__.p + __webpack_require__.u("lib_worker_js"), __webpack_require__.b), {
            type: undefined
        });
        console.log('constructing WebWorkerKernel done');
        this._worker.onmessage = e => {
            this._processWorkerMessage(e.data);
        };
        console.log('wrap');
        this._remote = (0,comlink__WEBPACK_IMPORTED_MODULE_0__.wrap)(this._worker);
        console.log('wrap done');
        this._remote.processMessage({
            msg: {
                header: {
                    msg_type: '__initialize__'
                },
                kernelspec: this._kernelspec
            }
        });
        console.log('init filesystem');
        this.initFileSystem(options);
        console.log('constructing WebWorkerKernel done2');
    }
    async handleMessage(msg) {
        console.log('handleMessage', msg);
        this._parent = msg;
        this._parentHeader = msg.header;
        console.log('send message to worker');
        await this._sendMessageToWorker(msg);
        console.log('send message to worker awaiting done');
    }
    async _sendMessageToWorker(msg) {
        // TODO Remove this??
        if (msg.header.msg_type !== 'input_reply') {
            this._executeDelegate = new _lumino_coreutils__WEBPACK_IMPORTED_MODULE_2__.PromiseDelegate();
        }
        console.log(' this._remote.processMessage({ msg, parent: this.parent });');
        await this._remote.processMessage({ msg, parent: this.parent });
        console.log(' this._remote.processMessage({ msg, parent: this.parent }); done');
        if (msg.header.msg_type !== 'input_reply') {
            return await this._executeDelegate.promise;
        }
    }
    /**
     * Get the last parent header
     */
    get parentHeader() {
        return this._parentHeader;
    }
    /**
     * Get the last parent message (mimick ipykernel's get_parent)
     */
    get parent() {
        return this._parent;
    }
    /**
     * Get the kernel location
     */
    get location() {
        return this._location;
    }
    /**
     * Process a message coming from the pyodide web worker.
     *
     * @param msg The worker message to process.
     */
    _processWorkerMessage(msg) {
        var _a, _b, _c, _d;
        console.log('processWorkerMessage', msg);
        if (!msg.header) {
            return;
        }
        msg.header.session = (_b = (_a = this._parentHeader) === null || _a === void 0 ? void 0 : _a.session) !== null && _b !== void 0 ? _b : '';
        msg.session = (_d = (_c = this._parentHeader) === null || _c === void 0 ? void 0 : _c.session) !== null && _d !== void 0 ? _d : '';
        this._sendMessage(msg);
        // resolve promise
        if (msg.header.msg_type === 'status' &&
            msg.content.execution_state === 'idle') {
            this._executeDelegate.resolve();
        }
    }
    /**
     * A promise that is fulfilled when the kernel is ready.
     */
    get ready() {
        return Promise.resolve();
    }
    /**
     * Return whether the kernel is disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * A signal emitted when the kernel is disposed.
     */
    get disposed() {
        return this._disposed;
    }
    /**
     * Dispose the kernel.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._worker.terminate();
        this._worker = null;
        this._remote = null;
        this._isDisposed = true;
        this._disposed.emit(void 0);
    }
    /**
     * Get the kernel id
     */
    get id() {
        return this._id;
    }
    /**
     * Get the name of the kernel
     */
    get name() {
        return this._name;
    }
    async initFileSystem(options) {
        let driveName;
        let localPath;
        if (options.location.includes(':')) {
            const parts = options.location.split(':');
            driveName = parts[0];
            localPath = parts[1];
        }
        else {
            driveName = '';
            localPath = options.location;
        }
        await this._remote.ready();
        if ( false || options.mountDrive) {
            await this._remote.mount(driveName, '/drive', _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_3__.PageConfig.getBaseUrl());
            await this._remote.cd(localPath);
        }
    }
}


/***/ })

}]);
//# sourceMappingURL=lib_index_js.7944edb5ab5b6076ee84.js.map