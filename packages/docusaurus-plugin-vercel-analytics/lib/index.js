"use strict";
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOptions = void 0;
exports.default = pluginVercelAnalytics;
function pluginVercelAnalytics(context, options) {
    if (process.env.NODE_ENV !== 'production') {
        return null;
    }
    return {
        name: 'docusaurus-plugin-vercel-analytics',
        getClientModules() {
            return ['./analytics'];
        },
        contentLoaded({ actions }) {
            actions.setGlobalData(options);
        },
    };
}
var options_1 = require("./options");
Object.defineProperty(exports, "validateOptions", { enumerable: true, get: function () { return options_1.validateOptions; } });
