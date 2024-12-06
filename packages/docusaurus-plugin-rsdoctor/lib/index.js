"use strict";
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOptions = void 0;
const rspack_plugin_1 = require("@rsdoctor/rspack-plugin");
const webpack_plugin_1 = require("@rsdoctor/webpack-plugin");
function createRsdoctorBundlerPlugin({ isServer, currentBundler, options, }) {
    const RsdoctorPlugin = currentBundler.name === 'rspack'
        ? rspack_plugin_1.RsdoctorRspackMultiplePlugin
        : webpack_plugin_1.RsdoctorWebpackMultiplePlugin;
    return new RsdoctorPlugin({
        name: isServer ? 'server' : 'client',
        ...options.rsdoctorOptions,
    });
}
exports.default = (async function pluginRsdoctor(context, options) {
    return {
        name: 'docusaurus-plugin-rsdoctor',
        configureWebpack: (__config, isServer) => {
            return {
                plugins: [
                    createRsdoctorBundlerPlugin({
                        isServer,
                        currentBundler: context.currentBundler,
                        options,
                    }),
                ],
            };
        },
    };
});
var options_1 = require("./options");
Object.defineProperty(exports, "validateOptions", { enumerable: true, get: function () { return options_1.validateOptions; } });
