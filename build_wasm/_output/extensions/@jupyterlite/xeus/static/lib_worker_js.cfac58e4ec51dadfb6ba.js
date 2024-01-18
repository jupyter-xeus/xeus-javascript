/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./lib/worker.js":
/*!***********************!*\
  !*** ./lib/worker.js ***!
  \***********************/
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = (() => { return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/@jupyterlite/contents/lib/drivefs.js":
/*!***********************************************************!*\
  !*** ./node_modules/@jupyterlite/contents/lib/drivefs.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __nested_webpack_exports__, __nested_webpack_require_433__) => {

__nested_webpack_require_433__.r(__nested_webpack_exports__);
/* harmony export */ __nested_webpack_require_433__.d(__nested_webpack_exports__, {
/* harmony export */   BLOCK_SIZE: () => (/* binding */ BLOCK_SIZE),
/* harmony export */   ContentsAPI: () => (/* binding */ ContentsAPI),
/* harmony export */   DRIVE_API_PATH: () => (/* binding */ DRIVE_API_PATH),
/* harmony export */   DRIVE_SEPARATOR: () => (/* binding */ DRIVE_SEPARATOR),
/* harmony export */   DriveFS: () => (/* binding */ DriveFS),
/* harmony export */   DriveFSEmscriptenNodeOps: () => (/* binding */ DriveFSEmscriptenNodeOps),
/* harmony export */   DriveFSEmscriptenStreamOps: () => (/* binding */ DriveFSEmscriptenStreamOps)
/* harmony export */ });
/* harmony import */ var _emscripten__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_433__(/*! ./emscripten */ "./node_modules/@jupyterlite/contents/lib/emscripten.js");
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
// Types and implementation inspired from https://github.com/jvilk/BrowserFS
// LICENSE: https://github.com/jvilk/BrowserFS/blob/8977a704ea469d05daf857e4818bef1f4f498326/LICENSE
// And from https://github.com/gzuidhof/starboard-notebook
// LICENSE: https://github.com/gzuidhof/starboard-notebook/blob/cd8d3fc30af4bd29cdd8f6b8c207df8138f5d5dd/LICENSE

const DRIVE_SEPARATOR = ':';
const DRIVE_API_PATH = '/api/drive.v1';
const BLOCK_SIZE = 4096;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');
// Mapping flag -> do we need to overwrite the file upon closing it
const flagNeedsWrite = {
    0 /*O_RDONLY*/: false,
    1 /*O_WRONLY*/: true,
    2 /*O_RDWR*/: true,
    64 /*O_CREAT*/: true,
    65 /*O_WRONLY|O_CREAT*/: true,
    66 /*O_RDWR|O_CREAT*/: true,
    129 /*O_WRONLY|O_EXCL*/: true,
    193 /*O_WRONLY|O_CREAT|O_EXCL*/: true,
    514 /*O_RDWR|O_TRUNC*/: true,
    577 /*O_WRONLY|O_CREAT|O_TRUNC*/: true,
    578 /*O_CREAT|O_RDWR|O_TRUNC*/: true,
    705 /*O_WRONLY|O_CREAT|O_EXCL|O_TRUNC*/: true,
    706 /*O_RDWR|O_CREAT|O_EXCL|O_TRUNC*/: true,
    1024 /*O_APPEND*/: true,
    1025 /*O_WRONLY|O_APPEND*/: true,
    1026 /*O_RDWR|O_APPEND*/: true,
    1089 /*O_WRONLY|O_CREAT|O_APPEND*/: true,
    1090 /*O_RDWR|O_CREAT|O_APPEND*/: true,
    1153 /*O_WRONLY|O_EXCL|O_APPEND*/: true,
    1154 /*O_RDWR|O_EXCL|O_APPEND*/: true,
    1217 /*O_WRONLY|O_CREAT|O_EXCL|O_APPEND*/: true,
    1218 /*O_RDWR|O_CREAT|O_EXCL|O_APPEND*/: true,
    4096 /*O_RDONLY|O_DSYNC*/: true,
    4098 /*O_RDWR|O_DSYNC*/: true,
};
class DriveFSEmscriptenStreamOps {
    constructor(fs) {
        this.fs = fs;
    }
    open(stream) {
        const path = this.fs.realPath(stream.node);
        if (this.fs.FS.isFile(stream.node.mode)) {
            stream.file = this.fs.API.get(path);
        }
    }
    close(stream) {
        if (!this.fs.FS.isFile(stream.node.mode) || !stream.file) {
            return;
        }
        const path = this.fs.realPath(stream.node);
        const flags = stream.flags;
        let parsedFlags = typeof flags === 'string' ? parseInt(flags, 10) : flags;
        parsedFlags &= 0x1fff;
        let needsWrite = true;
        if (parsedFlags in flagNeedsWrite) {
            needsWrite = flagNeedsWrite[parsedFlags];
        }
        if (needsWrite) {
            this.fs.API.put(path, stream.file);
        }
        stream.file = undefined;
    }
    read(stream, buffer, offset, length, position) {
        if (length <= 0 ||
            stream.file === undefined ||
            position >= (stream.file.data.length || 0)) {
            return 0;
        }
        const size = Math.min(stream.file.data.length - position, length);
        buffer.set(stream.file.data.subarray(position, position + size), offset);
        return size;
    }
    write(stream, buffer, offset, length, position) {
        var _a;
        if (length <= 0 || stream.file === undefined) {
            return 0;
        }
        stream.node.timestamp = Date.now();
        if (position + length > (((_a = stream.file) === null || _a === void 0 ? void 0 : _a.data.length) || 0)) {
            const oldData = stream.file.data ? stream.file.data : new Uint8Array();
            stream.file.data = new Uint8Array(position + length);
            stream.file.data.set(oldData);
        }
        stream.file.data.set(buffer.subarray(offset, offset + length), position);
        return length;
    }
    llseek(stream, offset, whence) {
        let position = offset;
        if (whence === _emscripten__WEBPACK_IMPORTED_MODULE_0__.SEEK_CUR) {
            position += stream.position;
        }
        else if (whence === _emscripten__WEBPACK_IMPORTED_MODULE_0__.SEEK_END) {
            if (this.fs.FS.isFile(stream.node.mode)) {
                if (stream.file !== undefined) {
                    position += stream.file.data.length;
                }
                else {
                    throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES.EPERM);
                }
            }
        }
        if (position < 0) {
            throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES.EINVAL);
        }
        return position;
    }
}
class DriveFSEmscriptenNodeOps {
    constructor(fs) {
        this.fs = fs;
    }
    getattr(node) {
        return {
            ...this.fs.API.getattr(this.fs.realPath(node)),
            mode: node.mode,
            ino: node.id,
        };
    }
    setattr(node, attr) {
        for (const [key, value] of Object.entries(attr)) {
            switch (key) {
                case 'mode':
                    node.mode = value;
                    break;
                case 'timestamp':
                    node.timestamp = value;
                    break;
                default:
                    console.warn('setattr', key, 'of', value, 'on', node, 'not yet implemented');
                    break;
            }
        }
    }
    lookup(parent, name) {
        const path = this.fs.PATH.join2(this.fs.realPath(parent), name);
        const result = this.fs.API.lookup(path);
        if (!result.ok) {
            throw this.fs.FS.genericErrors[this.fs.ERRNO_CODES['ENOENT']];
        }
        return this.fs.createNode(parent, name, result.mode, 0);
    }
    mknod(parent, name, mode, dev) {
        const path = this.fs.PATH.join2(this.fs.realPath(parent), name);
        this.fs.API.mknod(path, mode);
        return this.fs.createNode(parent, name, mode, dev);
    }
    rename(oldNode, newDir, newName) {
        this.fs.API.rename(oldNode.parent
            ? this.fs.PATH.join2(this.fs.realPath(oldNode.parent), oldNode.name)
            : oldNode.name, this.fs.PATH.join2(this.fs.realPath(newDir), newName));
        // Updating the in-memory node
        oldNode.name = newName;
        oldNode.parent = newDir;
    }
    unlink(parent, name) {
        this.fs.API.rmdir(this.fs.PATH.join2(this.fs.realPath(parent), name));
    }
    rmdir(parent, name) {
        this.fs.API.rmdir(this.fs.PATH.join2(this.fs.realPath(parent), name));
    }
    readdir(node) {
        return this.fs.API.readdir(this.fs.realPath(node));
    }
    symlink(parent, newName, oldPath) {
        throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['EPERM']);
    }
    readlink(node) {
        throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['EPERM']);
    }
}
/**
 * Wrap ServiceWorker requests for an Emscripten-compatible synchronous API.
 */
class ContentsAPI {
    constructor(baseUrl, driveName, mountpoint, FS, ERRNO_CODES) {
        this._baseUrl = baseUrl;
        this._driveName = driveName;
        this._mountpoint = mountpoint;
        this.FS = FS;
        this.ERRNO_CODES = ERRNO_CODES;
    }
    request(data) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', encodeURI(this.endpoint), false);
        try {
            xhr.send(JSON.stringify(data));
        }
        catch (e) {
            console.error(e);
        }
        if (xhr.status >= 400) {
            throw new this.FS.ErrnoError(this.ERRNO_CODES['EINVAL']);
        }
        return JSON.parse(xhr.responseText);
    }
    lookup(path) {
        return this.request({ method: 'lookup', path: this.normalizePath(path) });
    }
    getmode(path) {
        return Number.parseInt(this.request({ method: 'getmode', path: this.normalizePath(path) }));
    }
    mknod(path, mode) {
        return this.request({
            method: 'mknod',
            path: this.normalizePath(path),
            data: { mode },
        });
    }
    rename(oldPath, newPath) {
        return this.request({
            method: 'rename',
            path: this.normalizePath(oldPath),
            data: { newPath: this.normalizePath(newPath) },
        });
    }
    readdir(path) {
        const dirlist = this.request({
            method: 'readdir',
            path: this.normalizePath(path),
        });
        dirlist.push('.');
        dirlist.push('..');
        return dirlist;
    }
    rmdir(path) {
        return this.request({ method: 'rmdir', path: this.normalizePath(path) });
    }
    get(path) {
        const response = this.request({ method: 'get', path: this.normalizePath(path) });
        const serializedContent = response.content;
        const format = response.format;
        switch (format) {
            case 'json':
            case 'text':
                return {
                    data: encoder.encode(serializedContent),
                    format,
                };
            case 'base64': {
                const binString = atob(serializedContent);
                const len = binString.length;
                const data = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    data[i] = binString.charCodeAt(i);
                }
                return {
                    data,
                    format,
                };
            }
            default:
                throw new this.FS.ErrnoError(this.ERRNO_CODES['ENOENT']);
        }
    }
    put(path, value) {
        switch (value.format) {
            case 'json':
            case 'text':
                return this.request({
                    method: 'put',
                    path: this.normalizePath(path),
                    data: {
                        format: value.format,
                        data: decoder.decode(value.data),
                    },
                });
            case 'base64': {
                let binary = '';
                for (let i = 0; i < value.data.byteLength; i++) {
                    binary += String.fromCharCode(value.data[i]);
                }
                return this.request({
                    method: 'put',
                    path: this.normalizePath(path),
                    data: {
                        format: value.format,
                        data: btoa(binary),
                    },
                });
            }
        }
    }
    getattr(path) {
        const stats = this.request({
            method: 'getattr',
            path: this.normalizePath(path),
        });
        // Turn datetimes into proper objects
        stats.atime = new Date(stats.atime);
        stats.mtime = new Date(stats.mtime);
        stats.ctime = new Date(stats.ctime);
        // ensure a non-undefined size (0 isn't great, though)
        stats.size = stats.size || 0;
        return stats;
    }
    /**
     * Normalize a Path by making it compliant for the content manager
     *
     * @param path: the path relatively to the Emscripten drive
     */
    normalizePath(path) {
        // Remove mountpoint prefix
        if (path.startsWith(this._mountpoint)) {
            path = path.slice(this._mountpoint.length);
        }
        // Add JupyterLab drive name
        if (this._driveName) {
            path = `${this._driveName}${DRIVE_SEPARATOR}${path}`;
        }
        return path;
    }
    /**
     * Get the api/drive endpoint
     */
    get endpoint() {
        return `${this._baseUrl}api/drive`;
    }
}
class DriveFS {
    constructor(options) {
        this.FS = options.FS;
        this.PATH = options.PATH;
        this.ERRNO_CODES = options.ERRNO_CODES;
        this.API = new ContentsAPI(options.baseUrl, options.driveName, options.mountpoint, this.FS, this.ERRNO_CODES);
        this.driveName = options.driveName;
        this.node_ops = new DriveFSEmscriptenNodeOps(this);
        this.stream_ops = new DriveFSEmscriptenStreamOps(this);
    }
    mount(mount) {
        return this.createNode(null, mount.mountpoint, _emscripten__WEBPACK_IMPORTED_MODULE_0__.DIR_MODE | 511, 0);
    }
    createNode(parent, name, mode, dev) {
        const FS = this.FS;
        if (!FS.isDir(mode) && !FS.isFile(mode)) {
            throw new FS.ErrnoError(this.ERRNO_CODES['EINVAL']);
        }
        const node = FS.createNode(parent, name, mode, dev);
        node.node_ops = this.node_ops;
        node.stream_ops = this.stream_ops;
        return node;
    }
    getMode(path) {
        return this.API.getmode(path);
    }
    realPath(node) {
        const parts = [];
        let currentNode = node;
        parts.push(currentNode.name);
        while (currentNode.parent !== currentNode) {
            currentNode = currentNode.parent;
            parts.push(currentNode.name);
        }
        parts.reverse();
        return this.PATH.join.apply(null, parts);
    }
}
//# sourceMappingURL=drivefs.js.map

/***/ }),

/***/ "./node_modules/@jupyterlite/contents/lib/emscripten.js":
/*!**************************************************************!*\
  !*** ./node_modules/@jupyterlite/contents/lib/emscripten.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __nested_webpack_exports__, __nested_webpack_require_14176__) => {

__nested_webpack_require_14176__.r(__nested_webpack_exports__);
/* harmony export */ __nested_webpack_require_14176__.d(__nested_webpack_exports__, {
/* harmony export */   DIR_MODE: () => (/* binding */ DIR_MODE),
/* harmony export */   FILE_MODE: () => (/* binding */ FILE_MODE),
/* harmony export */   SEEK_CUR: () => (/* binding */ SEEK_CUR),
/* harmony export */   SEEK_END: () => (/* binding */ SEEK_END)
/* harmony export */ });
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/// <reference path="../../../node_modules/@types/emscripten/index.d.ts" />
const DIR_MODE = 16895; // 040777
const FILE_MODE = 33206; // 100666
const SEEK_CUR = 1;
const SEEK_END = 2;
//# sourceMappingURL=emscripten.js.map

/***/ }),

/***/ "./node_modules/comlink/dist/esm/comlink.mjs":
/*!***************************************************!*\
  !*** ./node_modules/comlink/dist/esm/comlink.mjs ***!
  \***************************************************/
/***/ ((__unused_webpack___webpack_module__, __nested_webpack_exports__, __nested_webpack_require_15227__) => {

__nested_webpack_require_15227__.r(__nested_webpack_exports__);
/* harmony export */ __nested_webpack_require_15227__.d(__nested_webpack_exports__, {
/* harmony export */   createEndpoint: () => (/* binding */ createEndpoint),
/* harmony export */   expose: () => (/* binding */ expose),
/* harmony export */   finalizer: () => (/* binding */ finalizer),
/* harmony export */   proxy: () => (/* binding */ proxy),
/* harmony export */   proxyMarker: () => (/* binding */ proxyMarker),
/* harmony export */   releaseProxy: () => (/* binding */ releaseProxy),
/* harmony export */   transfer: () => (/* binding */ transfer),
/* harmony export */   transferHandlers: () => (/* binding */ transferHandlers),
/* harmony export */   windowEndpoint: () => (/* binding */ windowEndpoint),
/* harmony export */   wrap: () => (/* binding */ wrap)
/* harmony export */ });
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const proxyMarker = Symbol("Comlink.proxy");
const createEndpoint = Symbol("Comlink.endpoint");
const releaseProxy = Symbol("Comlink.releaseProxy");
const finalizer = Symbol("Comlink.finalizer");
const throwMarker = Symbol("Comlink.thrown");
const isObject = (val) => (typeof val === "object" && val !== null) || typeof val === "function";
/**
 * Internal transfer handle to handle objects marked to proxy.
 */
const proxyTransferHandler = {
    canHandle: (val) => isObject(val) && val[proxyMarker],
    serialize(obj) {
        const { port1, port2 } = new MessageChannel();
        expose(obj, port1);
        return [port2, [port2]];
    },
    deserialize(port) {
        port.start();
        return wrap(port);
    },
};
/**
 * Internal transfer handler to handle thrown exceptions.
 */
const throwTransferHandler = {
    canHandle: (value) => isObject(value) && throwMarker in value,
    serialize({ value }) {
        let serialized;
        if (value instanceof Error) {
            serialized = {
                isError: true,
                value: {
                    message: value.message,
                    name: value.name,
                    stack: value.stack,
                },
            };
        }
        else {
            serialized = { isError: false, value };
        }
        return [serialized, []];
    },
    deserialize(serialized) {
        if (serialized.isError) {
            throw Object.assign(new Error(serialized.value.message), serialized.value);
        }
        throw serialized.value;
    },
};
/**
 * Allows customizing the serialization of certain values.
 */
const transferHandlers = new Map([
    ["proxy", proxyTransferHandler],
    ["throw", throwTransferHandler],
]);
function isAllowedOrigin(allowedOrigins, origin) {
    for (const allowedOrigin of allowedOrigins) {
        if (origin === allowedOrigin || allowedOrigin === "*") {
            return true;
        }
        if (allowedOrigin instanceof RegExp && allowedOrigin.test(origin)) {
            return true;
        }
    }
    return false;
}
function expose(obj, ep = globalThis, allowedOrigins = ["*"]) {
    ep.addEventListener("message", function callback(ev) {
        if (!ev || !ev.data) {
            return;
        }
        if (!isAllowedOrigin(allowedOrigins, ev.origin)) {
            console.warn(`Invalid origin '${ev.origin}' for comlink proxy`);
            return;
        }
        const { id, type, path } = Object.assign({ path: [] }, ev.data);
        const argumentList = (ev.data.argumentList || []).map(fromWireValue);
        let returnValue;
        try {
            const parent = path.slice(0, -1).reduce((obj, prop) => obj[prop], obj);
            const rawValue = path.reduce((obj, prop) => obj[prop], obj);
            switch (type) {
                case "GET" /* MessageType.GET */:
                    {
                        returnValue = rawValue;
                    }
                    break;
                case "SET" /* MessageType.SET */:
                    {
                        parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
                        returnValue = true;
                    }
                    break;
                case "APPLY" /* MessageType.APPLY */:
                    {
                        returnValue = rawValue.apply(parent, argumentList);
                    }
                    break;
                case "CONSTRUCT" /* MessageType.CONSTRUCT */:
                    {
                        const value = new rawValue(...argumentList);
                        returnValue = proxy(value);
                    }
                    break;
                case "ENDPOINT" /* MessageType.ENDPOINT */:
                    {
                        const { port1, port2 } = new MessageChannel();
                        expose(obj, port2);
                        returnValue = transfer(port1, [port1]);
                    }
                    break;
                case "RELEASE" /* MessageType.RELEASE */:
                    {
                        returnValue = undefined;
                    }
                    break;
                default:
                    return;
            }
        }
        catch (value) {
            returnValue = { value, [throwMarker]: 0 };
        }
        Promise.resolve(returnValue)
            .catch((value) => {
            return { value, [throwMarker]: 0 };
        })
            .then((returnValue) => {
            const [wireValue, transferables] = toWireValue(returnValue);
            ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
            if (type === "RELEASE" /* MessageType.RELEASE */) {
                // detach and deactive after sending release response above.
                ep.removeEventListener("message", callback);
                closeEndPoint(ep);
                if (finalizer in obj && typeof obj[finalizer] === "function") {
                    obj[finalizer]();
                }
            }
        })
            .catch((error) => {
            // Send Serialization Error To Caller
            const [wireValue, transferables] = toWireValue({
                value: new TypeError("Unserializable return value"),
                [throwMarker]: 0,
            });
            ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
        });
    });
    if (ep.start) {
        ep.start();
    }
}
function isMessagePort(endpoint) {
    return endpoint.constructor.name === "MessagePort";
}
function closeEndPoint(endpoint) {
    if (isMessagePort(endpoint))
        endpoint.close();
}
function wrap(ep, target) {
    return createProxy(ep, [], target);
}
function throwIfProxyReleased(isReleased) {
    if (isReleased) {
        throw new Error("Proxy has been released and is not useable");
    }
}
function releaseEndpoint(ep) {
    return requestResponseMessage(ep, {
        type: "RELEASE" /* MessageType.RELEASE */,
    }).then(() => {
        closeEndPoint(ep);
    });
}
const proxyCounter = new WeakMap();
const proxyFinalizers = "FinalizationRegistry" in globalThis &&
    new FinalizationRegistry((ep) => {
        const newCount = (proxyCounter.get(ep) || 0) - 1;
        proxyCounter.set(ep, newCount);
        if (newCount === 0) {
            releaseEndpoint(ep);
        }
    });
function registerProxy(proxy, ep) {
    const newCount = (proxyCounter.get(ep) || 0) + 1;
    proxyCounter.set(ep, newCount);
    if (proxyFinalizers) {
        proxyFinalizers.register(proxy, ep, proxy);
    }
}
function unregisterProxy(proxy) {
    if (proxyFinalizers) {
        proxyFinalizers.unregister(proxy);
    }
}
function createProxy(ep, path = [], target = function () { }) {
    let isProxyReleased = false;
    const proxy = new Proxy(target, {
        get(_target, prop) {
            throwIfProxyReleased(isProxyReleased);
            if (prop === releaseProxy) {
                return () => {
                    unregisterProxy(proxy);
                    releaseEndpoint(ep);
                    isProxyReleased = true;
                };
            }
            if (prop === "then") {
                if (path.length === 0) {
                    return { then: () => proxy };
                }
                const r = requestResponseMessage(ep, {
                    type: "GET" /* MessageType.GET */,
                    path: path.map((p) => p.toString()),
                }).then(fromWireValue);
                return r.then.bind(r);
            }
            return createProxy(ep, [...path, prop]);
        },
        set(_target, prop, rawValue) {
            throwIfProxyReleased(isProxyReleased);
            // FIXME: ES6 Proxy Handler `set` methods are supposed to return a
            // boolean. To show good will, we return true asynchronously ¯\_(ツ)_/¯
            const [value, transferables] = toWireValue(rawValue);
            return requestResponseMessage(ep, {
                type: "SET" /* MessageType.SET */,
                path: [...path, prop].map((p) => p.toString()),
                value,
            }, transferables).then(fromWireValue);
        },
        apply(_target, _thisArg, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const last = path[path.length - 1];
            if (last === createEndpoint) {
                return requestResponseMessage(ep, {
                    type: "ENDPOINT" /* MessageType.ENDPOINT */,
                }).then(fromWireValue);
            }
            // We just pretend that `bind()` didn’t happen.
            if (last === "bind") {
                return createProxy(ep, path.slice(0, -1));
            }
            const [argumentList, transferables] = processArguments(rawArgumentList);
            return requestResponseMessage(ep, {
                type: "APPLY" /* MessageType.APPLY */,
                path: path.map((p) => p.toString()),
                argumentList,
            }, transferables).then(fromWireValue);
        },
        construct(_target, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const [argumentList, transferables] = processArguments(rawArgumentList);
            return requestResponseMessage(ep, {
                type: "CONSTRUCT" /* MessageType.CONSTRUCT */,
                path: path.map((p) => p.toString()),
                argumentList,
            }, transferables).then(fromWireValue);
        },
    });
    registerProxy(proxy, ep);
    return proxy;
}
function myFlat(arr) {
    return Array.prototype.concat.apply([], arr);
}
function processArguments(argumentList) {
    const processed = argumentList.map(toWireValue);
    return [processed.map((v) => v[0]), myFlat(processed.map((v) => v[1]))];
}
const transferCache = new WeakMap();
function transfer(obj, transfers) {
    transferCache.set(obj, transfers);
    return obj;
}
function proxy(obj) {
    return Object.assign(obj, { [proxyMarker]: true });
}
function windowEndpoint(w, context = globalThis, targetOrigin = "*") {
    return {
        postMessage: (msg, transferables) => w.postMessage(msg, targetOrigin, transferables),
        addEventListener: context.addEventListener.bind(context),
        removeEventListener: context.removeEventListener.bind(context),
    };
}
function toWireValue(value) {
    for (const [name, handler] of transferHandlers) {
        if (handler.canHandle(value)) {
            const [serializedValue, transferables] = handler.serialize(value);
            return [
                {
                    type: "HANDLER" /* WireValueType.HANDLER */,
                    name,
                    value: serializedValue,
                },
                transferables,
            ];
        }
    }
    return [
        {
            type: "RAW" /* WireValueType.RAW */,
            value,
        },
        transferCache.get(value) || [],
    ];
}
function fromWireValue(value) {
    switch (value.type) {
        case "HANDLER" /* WireValueType.HANDLER */:
            return transferHandlers.get(value.name).deserialize(value.value);
        case "RAW" /* WireValueType.RAW */:
            return value.value;
    }
}
function requestResponseMessage(ep, msg, transfers) {
    return new Promise((resolve) => {
        const id = generateUUID();
        ep.addEventListener("message", function l(ev) {
            if (!ev.data || !ev.data.id || ev.data.id !== id) {
                return;
            }
            ep.removeEventListener("message", l);
            resolve(ev.data);
        });
        if (ep.start) {
            ep.start();
        }
        ep.postMessage(Object.assign({ id }, msg), transfers);
    });
}
function generateUUID() {
    return new Array(4)
        .fill(0)
        .map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16))
        .join("-");
}


//# sourceMappingURL=comlink.mjs.map


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nested_webpack_require_28330__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __nested_webpack_require_28330__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__nested_webpack_require_28330__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__nested_webpack_require_28330__.o(definition, key) && !__nested_webpack_require_28330__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__nested_webpack_require_28330__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__nested_webpack_require_28330__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __nested_webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!***********************!*\
  !*** ./lib/worker.js ***!
  \***********************/
__nested_webpack_require_28330__.r(__nested_webpack_exports__);
/* harmony import */ var comlink__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_28330__(/*! comlink */ "./node_modules/comlink/dist/esm/comlink.mjs");
/* harmony import */ var _jupyterlite_contents__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_28330__(/*! @jupyterlite/contents */ "./node_modules/@jupyterlite/contents/lib/drivefs.js");
// Copyright (c) Thorsten Beier
// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.
console.log('worker loaded');


globalThis.Module = {};
class StreamNodeOps extends _jupyterlite_contents__WEBPACK_IMPORTED_MODULE_0__.DriveFSEmscriptenNodeOps {
    getNode(nodeOrStream) {
        if (nodeOrStream['node']) {
            return nodeOrStream['node'];
        }
        return nodeOrStream;
    }
    lookup(parent, name) {
        return super.lookup(this.getNode(parent), name);
    }
    getattr(node) {
        return super.getattr(this.getNode(node));
    }
    setattr(node, attr) {
        super.setattr(this.getNode(node), attr);
    }
    mknod(parent, name, mode, dev) {
        return super.mknod(this.getNode(parent), name, mode, dev);
    }
    rename(oldNode, newDir, newName) {
        super.rename(this.getNode(oldNode), this.getNode(newDir), newName);
    }
    rmdir(parent, name) {
        super.rmdir(this.getNode(parent), name);
    }
    readdir(node) {
        return super.readdir(this.getNode(node));
    }
}
// TODO Remove this when we don't need StreamNodeOps anymore
class LoggingDrive extends _jupyterlite_contents__WEBPACK_IMPORTED_MODULE_0__.DriveFS {
    constructor(options) {
        super(options);
        this.node_ops = new StreamNodeOps(this);
    }
}
// when a toplevel cell uses an await, the cell is implicitly
// wrapped in a async function. Since the webloop - eventloop
// implementation does not support `eventloop.run_until_complete(f)`
// we need to convert the toplevel future in a javascript Promise
// this `toplevel` promise is then awaited before we
// execute the next cell. After the promise is awaited we need
// to do some cleanup and delete the python proxy
// (ie a js-wrapped python object) to avoid memory leaks
globalThis.toplevel_promise = null;
globalThis.toplevel_promise_py_proxy = null;
let resolveInputReply;
async function get_stdin() {
    const replyPromise = new Promise(resolve => {
        resolveInputReply = resolve;
    });
    return replyPromise;
}
self.get_stdin = get_stdin;
class XeusKernel {
    constructor(resolve) {
        this._drive = null;
        console.log('constructing kernel');
        this._resolve = resolve;
    }
    async ready() {
        return await globalThis.ready;
    }
    mount(driveName, mountpoint, baseUrl) {
        console.log('mounting drive');
        const { FS, PATH, ERRNO_CODES } = globalThis.Module;
        if (!FS) {
            return;
        }
        this._drive = new LoggingDrive({
            FS,
            PATH,
            ERRNO_CODES,
            baseUrl,
            driveName,
            mountpoint
        });
        FS.mkdir(mountpoint);
        FS.mount(this._drive, {}, mountpoint);
        FS.chdir(mountpoint);
    }
    cd(path) {
        if (!path || !globalThis.Module.FS) {
            return;
        }
        globalThis.Module.FS.chdir(path);
    }
    async processMessage(event) {
        const msg_type = event.msg.header.msg_type;
        if (msg_type === '__initialize__') {
            this._kernelspec = event.msg.kernelspec;
            await this.initialize();
            return;
        }
        await this.ready();
        if (globalThis.toplevel_promise !== null &&
            globalThis.toplevel_promise_py_proxy !== null) {
            await globalThis.toplevel_promise;
            globalThis.toplevel_promise_py_proxy.delete();
            globalThis.toplevel_promise_py_proxy = null;
            globalThis.toplevel_promise = null;
        }
        if (msg_type === 'input_reply') {
            resolveInputReply(event.msg);
        }
        else {
            this._raw_xserver.notify_listener(event.msg);
        }
    }
    async initialize() {
        // the location of the kernel on the server
        // ie `share/jupyter/kernels/${dir}`
        const dir = this._kernelspec.dir;
        // location of the kernel binary on the server
        const binary_js = this._kernelspec.argv[0];
        const binary_wasm = binary_js.replace('.js', '.wasm');
        importScripts(binary_js);
        globalThis.Module = await createXeusModule({
            locateFile: (file) => {
                if (file.endsWith('.wasm')) {
                    return binary_wasm;
                }
                return file;
            }
        });
        try {
            await this.waitRunDependency();
            console.log(globalThis.Module);
            // each kernel can have a `async_init` function
            // which can do kernel specific **async** initialization
            // This function is usually implemented in the pre/post.js
            // in the emscripten build of that kernel
            if (globalThis.Module['async_init'] !== undefined) {
                const kernel_root_url = `share/jupyter/kernels/${dir}`;
                const pkg_root_url = 'share/jupyter/kernel_packages';
                const verbose = true;
                await globalThis.Module['async_init'](kernel_root_url, pkg_root_url, verbose);
            }
            else {
                console.log('no async_init found');
            }
            await this.waitRunDependency();
            this._raw_xkernel = new globalThis.Module.xkernel();
            this._raw_xserver = this._raw_xkernel.get_server();
            if (!this._raw_xkernel) {
                console.error('Failed to start kernel!');
            }
            this._raw_xkernel.start();
        }
        catch (e) {
            if (typeof e === 'number') {
                const msg = globalThis.Module.get_exception_message(e);
                console.error(msg);
                throw new Error(msg);
            }
            else {
                console.error(e);
                throw e;
            }
        }
        this._resolve();
    }
    async waitRunDependency() {
        const promise = new Promise(resolve => {
            globalThis.Module.monitorRunDependencies = (n) => {
                if (n === 0) {
                    resolve();
                }
            };
        });
        // If there are no pending dependencies left, monitorRunDependencies will
        // never be called. Since we can't check the number of dependencies,
        // manually trigger a call.
        globalThis.Module.addRunDependency('dummy');
        globalThis.Module.removeRunDependency('dummy');
        return promise;
    }
}
globalThis.ready = new Promise(resolve => {
    console.log('expose(new XeusKernel(resolve));');
    (0,comlink__WEBPACK_IMPORTED_MODULE_1__.expose)(new XeusKernel(resolve));
});

})();

/******/ 	return __nested_webpack_exports__;
/******/ })()
;
}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = __webpack_module_cache__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/sharing */
/******/ 	(() => {
/******/ 		__webpack_require__.S = {};
/******/ 		var initPromises = {};
/******/ 		var initTokens = {};
/******/ 		__webpack_require__.I = (name, initScope) => {
/******/ 			if(!initScope) initScope = [];
/******/ 			// handling circular init calls
/******/ 			var initToken = initTokens[name];
/******/ 			if(!initToken) initToken = initTokens[name] = {};
/******/ 			if(initScope.indexOf(initToken) >= 0) return;
/******/ 			initScope.push(initToken);
/******/ 			// only runs once
/******/ 			if(initPromises[name]) return initPromises[name];
/******/ 			// creates a new share scope if needed
/******/ 			if(!__webpack_require__.o(__webpack_require__.S, name)) __webpack_require__.S[name] = {};
/******/ 			// runs all init snippets from all modules reachable
/******/ 			var scope = __webpack_require__.S[name];
/******/ 			var warn = (msg) => {
/******/ 				if (typeof console !== "undefined" && console.warn) console.warn(msg);
/******/ 			};
/******/ 			var uniqueName = "@jupyterlite/xeus";
/******/ 			var register = (name, version, factory, eager) => {
/******/ 				var versions = scope[name] = scope[name] || {};
/******/ 				var activeVersion = versions[version];
/******/ 				if(!activeVersion || (!activeVersion.loaded && (!eager != !activeVersion.eager ? eager : uniqueName > activeVersion.from))) versions[version] = { get: factory, from: uniqueName, eager: !!eager };
/******/ 			};
/******/ 			var initExternal = (id) => {
/******/ 				var handleError = (err) => (warn("Initialization of sharing external failed: " + err));
/******/ 				try {
/******/ 					var module = __webpack_require__(id);
/******/ 					if(!module) return;
/******/ 					var initFn = (module) => (module && module.init && module.init(__webpack_require__.S[name], initScope))
/******/ 					if(module.then) return promises.push(module.then(initFn, handleError));
/******/ 					var initResult = initFn(module);
/******/ 					if(initResult && initResult.then) return promises.push(initResult['catch'](handleError));
/******/ 				} catch(err) { handleError(err); }
/******/ 			}
/******/ 			var promises = [];
/******/ 			switch(name) {
/******/ 			}
/******/ 			if(!promises.length) return initPromises[name] = 1;
/******/ 			return initPromises[name] = Promise.all(promises).then(() => (initPromises[name] = 1));
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// module cache are used so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	var __webpack_exports__ = __webpack_require__("./lib/worker.js");
/******/ 	
/******/ })()
;
//# sourceMappingURL=lib_worker_js.cfac58e4ec51dadfb6ba.js.map