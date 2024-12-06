"use strict";
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rspack = exports.getSwcLoaderOptions = exports.swcLoader = void 0;
exports.getSwcHtmlMinifier = getSwcHtmlMinifier;
exports.getSwcJsMinimizerOptions = getSwcJsMinimizerOptions;
exports.getBrowserslistQueries = getBrowserslistQueries;
exports.getLightningCssMinimizerOptions = getLightningCssMinimizerOptions;
const tslib_1 = require("tslib");
const core_1 = tslib_1.__importDefault(require("@rspack/core"));
const lightningcss = tslib_1.__importStar(require("lightningcss"));
const browserslist_1 = tslib_1.__importDefault(require("browserslist"));
const html_1 = require("@swc/html");
exports.swcLoader = require.resolve('swc-loader');
const getSwcLoaderOptions = ({ isServer, }) => {
    return {
        env: {
            targets: getBrowserslistQueries({ isServer }),
        },
        jsc: {
            parser: {
                syntax: 'typescript',
                tsx: true,
            },
            transform: {
                react: {
                    runtime: 'automatic',
                },
            },
        },
    };
};
exports.getSwcLoaderOptions = getSwcLoaderOptions;
exports.rspack = core_1.default;
function getSwcHtmlMinifier() {
    return html_1.minify;
}
// Note: these options are similar to what we use in core
// They should rather be kept in sync for now to avoid any unexpected behavior
// The goal of faster minifier is not to fine-tune options but only to be faster
// See core minification.ts
function getSwcJsMinimizerOptions() {
    return {
        ecma: 2020,
        compress: {
            ecma: 5,
        },
        module: true,
        mangle: true,
        safari10: true,
        format: {
            ecma: 5,
            comments: false,
            ascii_only: true,
        },
    };
}
// We need this because of Rspack built-in LightningCSS integration
// See https://github.com/orgs/browserslist/discussions/846
function getBrowserslistQueries({ isServer, }) {
    if (isServer) {
        return [`node ${process.versions.node}`];
    }
    const queries = browserslist_1.default.loadConfig({ path: process.cwd() }) ?? [
        ...browserslist_1.default.defaults,
    ];
    return queries;
}
function getLightningCssMinimizerOptions() {
    const queries = (0, browserslist_1.default)();
    return { targets: lightningcss.browserslistToTargets(queries) };
}
//# sourceMappingURL=index.js.map