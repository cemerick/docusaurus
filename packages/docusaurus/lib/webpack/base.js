"use strict";
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientDir = void 0;
exports.excludeJS = excludeJS;
exports.createBaseConfig = createBaseConfig;
const tslib_1 = require("tslib");
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const path_1 = tslib_1.__importDefault(require("path"));
const babel_1 = require("@docusaurus/babel");
const bundler_1 = require("@docusaurus/bundler");
const utils_1 = require("@docusaurus/utils");
const aliases_1 = require("./aliases");
const CSS_REGEX = /\.css$/i;
const CSS_MODULE_REGEX = /\.module\.css$/i;
exports.clientDir = path_1.default.join(__dirname, '..', 'client');
const LibrariesToTranspile = [
    'copy-text-to-clipboard', // Contains optional catch binding, incompatible with recent versions of Edge
];
const LibrariesToTranspileRegex = new RegExp(LibrariesToTranspile.map((libName) => `(node_modules/${libName})`).join('|'));
const ReactAliases = process.env
    .DOCUSAURUS_NO_REACT_ALIASES
    ? {}
    : {
        react: path_1.default.dirname(require.resolve('react/package.json')),
        'react-dom': path_1.default.dirname(require.resolve('react-dom/package.json')),
        '@mdx-js/react': path_1.default.dirname(require.resolve('@mdx-js/react')),
    };
function excludeJS(modulePath) {
    // Always transpile client dir
    if (modulePath.startsWith(exports.clientDir)) {
        return false;
    }
    // Don't transpile node_modules except any docusaurus npm package
    return (modulePath.includes('node_modules') &&
        !/docusaurus(?:(?!node_modules).)*\.jsx?$/.test(modulePath) &&
        !LibrariesToTranspileRegex.test(modulePath));
}
async function createBaseConfig({ props, isServer, minify, faster, configureWebpackUtils, }) {
    const { outDir, siteDir, siteConfig, siteConfigPath, baseUrl, generatedFilesDir, routesPaths, siteMetadata, plugins, } = props;
    const totalPages = routesPaths.length;
    const isProd = process.env.NODE_ENV === 'production';
    const minimizeEnabled = minify && isProd;
    const fileLoaderUtils = (0, utils_1.getFileLoaderUtils)(isServer);
    const name = isServer ? 'server' : 'client';
    const mode = isProd ? 'production' : 'development';
    const themeAliases = await (0, aliases_1.loadThemeAliases)({ siteDir, plugins });
    const createJsLoader = await (0, bundler_1.createJsLoaderFactory)({ siteConfig });
    const CSSExtractPlugin = await (0, bundler_1.getCSSExtractPlugin)({
        currentBundler: props.currentBundler,
    });
    function getCache() {
        if (props.currentBundler.name === 'rspack') {
            // TODO Rspack only supports memory cache (as of Sept 2024)
            // TODO re-enable file persistent cache one Rspack supports it
            //  See also https://rspack.dev/config/cache#cache
            return undefined;
        }
        return {
            type: 'filesystem',
            // Can we share the same cache across locales?
            // Exploring that question at https://github.com/webpack/webpack/issues/13034
            // name: `${name}-${mode}`,
            name: `${name}-${mode}-${props.i18n.currentLocale}`,
            // When version string changes, cache is evicted
            version: [
                siteMetadata.docusaurusVersion,
                // Webpack does not evict the cache correctly on alias/swizzle change,
                // so we force eviction.
                // See https://github.com/webpack/webpack/issues/13627
                (0, utils_1.md5Hash)(JSON.stringify(themeAliases)),
            ].join('-'),
            // When one of those modules/dependencies change (including transitive
            // deps), cache is invalidated
            buildDependencies: {
                config: [
                    __filename,
                    path_1.default.join(__dirname, isServer ? 'server.js' : 'client.js'),
                    // Docusaurus config changes can affect MDX/JSX compilation, so we'd
                    // rather evict the cache.
                    // See https://github.com/questdb/questdb.io/issues/493
                    siteConfigPath,
                ],
            },
        };
    }
    function getExperiments() {
        if (props.currentBundler.name === 'rspack') {
            return {
                // This is mostly useful in dev
                // See https://rspack.dev/config/experiments#experimentsincremental
                // Produces warnings in production builds
                // See https://github.com/web-infra-dev/rspack/pull/8311#issuecomment-2476014664
                // @ts-expect-error: Rspack-only
                // incremental: !isProd,
                // TODO restore incremental mode in dev + opt-in/opt-out flag?
                //  temporarily disabled due to https://github.com/facebook/docusaurus/issues/10646#issuecomment-2490675451
                incremental: undefined,
            };
        }
        return undefined;
    }
    return {
        mode,
        name,
        cache: getCache(),
        experiments: getExperiments(),
        output: {
            pathinfo: false,
            path: outDir,
            filename: isProd ? 'assets/js/[name].[contenthash:8].js' : '[name].js',
            chunkFilename: isProd
                ? 'assets/js/[name].[contenthash:8].js'
                : '[name].js',
            publicPath: siteConfig.future.experimental_router === 'hash' ? 'auto' : baseUrl,
            hashFunction: 'xxhash64',
        },
        // Don't throw warning when asset created is over 250kb
        performance: {
            hints: false,
        },
        devtool: isProd ? undefined : 'eval-cheap-module-source-map',
        resolve: {
            extensions: ['.wasm', '.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
            symlinks: true, // See https://github.com/facebook/docusaurus/issues/3272
            roots: [
                // Allow resolution of url("/fonts/xyz.ttf") by webpack
                // See https://webpack.js.org/configuration/resolve/#resolveroots
                // See https://github.com/webpack-contrib/css-loader/issues/1256
                ...siteConfig.staticDirectories.map((dir) => path_1.default.resolve(siteDir, dir)),
                siteDir,
                process.cwd(),
            ],
            alias: {
                ...ReactAliases,
                '@site': siteDir,
                '@generated': generatedFilesDir,
                ...(await (0, aliases_1.loadDocusaurusAliases)()),
                ...themeAliases,
            },
            // This allows you to set a fallback for where Webpack should look for
            // modules. We want `@docusaurus/core` own dependencies/`node_modules` to
            // "win" if there is conflict. Example: if there is core-js@3 in user's
            // own node_modules, but core depends on core-js@2, we should use
            // core-js@2.
            modules: [
                path_1.default.resolve(__dirname, '..', '..', 'node_modules'),
                'node_modules',
                path_1.default.resolve(await fs_extra_1.default.realpath(process.cwd()), 'node_modules'),
            ],
        },
        resolveLoader: {
            modules: ['node_modules', path_1.default.join(siteDir, 'node_modules')],
        },
        optimization: {
            removeAvailableModules: false,
            // Only minimize client bundle in production because server bundle is only
            // used for static site generation
            minimize: minimizeEnabled,
            minimizer: minimizeEnabled
                ? await (0, bundler_1.getMinimizers)({ faster, currentBundler: props.currentBundler })
                : undefined,
            splitChunks: isServer
                ? false
                : {
                    // Since the chunk name includes all origin chunk names it's
                    // recommended for production builds with long term caching to NOT
                    // include [name] in the filenames
                    name: false,
                    cacheGroups: {
                        // Disable the built-in cacheGroups
                        default: false,
                        common: {
                            name: 'common',
                            minChunks: totalPages > 2 ? totalPages * 0.5 : 2,
                            priority: 40,
                        },
                        // Only create one CSS file to avoid
                        // problems with code-split CSS loading in different orders
                        // causing inconsistent/non-deterministic styling
                        // See https://github.com/facebook/docusaurus/issues/2006
                        styles: {
                            name: 'styles',
                            type: 'css/mini-extract',
                            chunks: `all`,
                            enforce: true,
                            priority: 50,
                        },
                    },
                },
        },
        module: {
            rules: [
                fileLoaderUtils.rules.images(),
                fileLoaderUtils.rules.fonts(),
                fileLoaderUtils.rules.media(),
                fileLoaderUtils.rules.otherAssets(),
                {
                    test: /\.[jt]sx?$/i,
                    exclude: excludeJS,
                    use: [
                        createJsLoader({
                            isServer,
                            babelOptions: await (0, babel_1.getCustomBabelConfigFilePath)(siteDir),
                        }),
                    ],
                },
                {
                    test: CSS_REGEX,
                    exclude: CSS_MODULE_REGEX,
                    use: configureWebpackUtils.getStyleLoaders(isServer, {
                        importLoaders: 1,
                        sourceMap: !isProd,
                    }),
                },
                // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
                // using the extension .module.css
                {
                    test: CSS_MODULE_REGEX,
                    use: configureWebpackUtils.getStyleLoaders(isServer, {
                        modules: {
                            // Using the same CSS Module class pattern in dev/prod on purpose
                            // See https://github.com/facebook/docusaurus/pull/10423
                            localIdentName: `[local]_[contenthash:base64:4]`,
                            exportOnlyLocals: isServer,
                        },
                        importLoaders: 1,
                        sourceMap: !isProd,
                    }),
                },
            ],
        },
        plugins: [
            new CSSExtractPlugin({
                filename: isProd
                    ? 'assets/css/[name].[contenthash:8].css'
                    : '[name].css',
                chunkFilename: isProd
                    ? 'assets/css/[name].[contenthash:8].css'
                    : '[name].css',
                // Remove css order warnings if css imports are not sorted
                // alphabetically. See https://github.com/webpack-contrib/mini-css-extract-plugin/pull/422
                // for more reasoning
                ignoreOrder: true,
            }),
        ],
    };
}
