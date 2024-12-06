"use strict";
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOptions = void 0;
exports.default = pluginPWA;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const bundler_1 = require("@docusaurus/bundler");
const workbox_build_1 = require("workbox-build");
const utils_1 = require("@docusaurus/utils");
const logger_1 = tslib_1.__importDefault(require("@docusaurus/logger"));
const theme_translations_1 = require("@docusaurus/theme-translations");
const PluginName = 'docusaurus-plugin-pwa';
function getSWBabelLoader() {
    return {
        loader: 'babel-loader',
        options: {
            babelrc: false,
            configFile: false,
            presets: [
                [
                    require.resolve('@babel/preset-env'),
                    {
                        useBuiltIns: 'entry',
                        corejs: '3',
                        // See https://x.com/jeffposnick/status/1280223070876315649
                        targets: 'chrome >= 56',
                    },
                ],
            ],
        },
    };
}
function pluginPWA(context, options) {
    if (process.env.NODE_ENV !== 'production') {
        return null;
    }
    if (context.siteConfig.future.experimental_router === 'hash') {
        logger_1.default.warn(`${PluginName} does not support the Hash Router and will be disabled.`);
        return null;
    }
    const { outDir, baseUrl, i18n: { currentLocale }, } = context;
    const { debug, offlineModeActivationStrategies, injectManifestConfig, pwaHead, swCustom, swRegister, } = options;
    return {
        name: PluginName,
        getThemePath() {
            return '../lib/theme';
        },
        getTypeScriptThemePath() {
            return '../src/theme';
        },
        getClientModules() {
            return swRegister ? [swRegister] : [];
        },
        getDefaultCodeTranslationMessages() {
            return (0, theme_translations_1.readDefaultCodeTranslationMessages)({
                locale: currentLocale,
                name: 'plugin-pwa',
            });
        },
        configureWebpack(config, isServer, { currentBundler }) {
            return {
                plugins: [
                    new currentBundler.instance.EnvironmentPlugin({
                        PWA_DEBUG: debug,
                        PWA_SERVICE_WORKER_URL: path_1.default.posix.resolve(`${config.output?.publicPath || '/'}`, 'sw.js'),
                        PWA_OFFLINE_MODE_ACTIVATION_STRATEGIES: offlineModeActivationStrategies,
                    }),
                ],
            };
        },
        injectHtmlTags() {
            const headTags = [];
            pwaHead.forEach(({ tagName, ...attributes }) => {
                ['href', 'content'].forEach((attribute) => {
                    const attributeValue = attributes[attribute];
                    if (!attributeValue) {
                        return;
                    }
                    const attributePath = !!path_1.default.extname(attributeValue) && attributeValue;
                    if (attributePath && !attributePath.startsWith(baseUrl)) {
                        attributes[attribute] = (0, utils_1.normalizeUrl)([baseUrl, attributeValue]);
                    }
                });
                return headTags.push({
                    tagName,
                    attributes,
                });
            });
            return { headTags };
        },
        async postBuild(props) {
            const swSourceFileTest = /\.m?js$/;
            const ProgressBarPlugin = await (0, bundler_1.getProgressBarPlugin)({
                currentBundler: props.currentBundler,
            });
            const swWebpackConfig = {
                entry: require.resolve('./sw.js'),
                output: {
                    path: outDir,
                    filename: 'sw.js',
                    publicPath: baseUrl,
                },
                target: 'webworker',
                mode: debug ? 'development' : 'production',
                devtool: debug ? 'source-map' : false,
                optimization: {
                    splitChunks: false,
                    minimize: !debug,
                    // See https://developers.google.com/web/tools/workbox/guides/using-bundlers#webpack
                    minimizer: debug
                        ? []
                        : await (0, bundler_1.getMinimizers)({
                            faster: props.siteConfig.future.experimental_faster,
                            currentBundler: props.currentBundler,
                        }),
                },
                plugins: [
                    new props.currentBundler.instance.EnvironmentPlugin({
                        // Fallback value required with Webpack 5
                        PWA_SW_CUSTOM: swCustom ?? '',
                    }),
                    new ProgressBarPlugin({
                        name: 'Service Worker',
                        color: 'red',
                    }),
                ],
                module: {
                    rules: [
                        {
                            test: swSourceFileTest,
                            exclude: /node_modules/,
                            use: getSWBabelLoader(),
                        },
                    ],
                },
            };
            await (0, bundler_1.compile)({
                configs: [swWebpackConfig],
                currentBundler: props.currentBundler,
            });
            const swDest = path_1.default.resolve(props.outDir, 'sw.js');
            await (0, workbox_build_1.injectManifest)({
                ...injectManifestConfig,
                globPatterns: [
                    '**/*.{js,json,css,html}',
                    '**/*.{png,jpg,jpeg,gif,svg,ico}',
                    '**/*.{woff,woff2,eot,ttf,otf}',
                    // @ts-expect-error: internal API?
                    ...(workbox_build_1.injectManifest.globPatterns ?? []),
                ],
                // Those attributes are not overrideable
                swDest,
                swSrc: swDest,
                globDirectory: props.outDir,
            });
        },
    };
}
var options_1 = require("./options");
Object.defineProperty(exports, "validateOptions", { enumerable: true, get: function () { return options_1.validateOptions; } });
