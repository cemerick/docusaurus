"use strict";
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleBrokenLinks = handleBrokenLinks;
const tslib_1 = require("tslib");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const logger_1 = tslib_1.__importDefault(require("@docusaurus/logger"));
const react_router_config_1 = require("react-router-config");
const utils_1 = require("@docusaurus/utils");
const utils_common_1 = require("@docusaurus/utils-common");
function matchRoutes(routeConfig, pathname) {
    // @ts-expect-error: React router types RouteConfig with an actual React
    // component, but we load route components with string paths.
    // We don't actually access component here, so it's fine.
    return (0, react_router_config_1.matchRoutes)(routeConfig, pathname);
}
function createBrokenLinksHelper({ collectedLinks, routes, }) {
    const validPathnames = new Set(collectedLinks.keys());
    // IMPORTANT: this is an optimization
    // See https://github.com/facebook/docusaurus/issues/9754
    // Matching against the route array can be expensive
    // If the route is already in the valid pathnames,
    // we can avoid matching against it
    const remainingRoutes = (function filterRoutes() {
        // Goal: unit tests should behave the same with this enabled or disabled
        const disableOptimization = false;
        if (disableOptimization) {
            return routes;
        }
        // We must consider the "exact" and "strict" match attribute
        // We can only infer pre-validated pathnames from a route from exact routes
        const [validPathnameRoutes, otherRoutes] = lodash_1.default.partition(routes, (route) => route.exact && validPathnames.has(route.path));
        // If a route is non-strict (non-sensitive to trailing slashes)
        // We must pre-validate all possible paths
        validPathnameRoutes.forEach((validPathnameRoute) => {
            if (!validPathnameRoute.strict) {
                validPathnames.add((0, utils_common_1.addTrailingSlash)(validPathnameRoute.path));
                validPathnames.add((0, utils_common_1.removeTrailingSlash)(validPathnameRoute.path));
            }
        });
        return otherRoutes;
    })();
    function isPathnameMatchingAnyRoute(pathname) {
        if (matchRoutes(remainingRoutes, pathname).length > 0) {
            // IMPORTANT: this is an optimization
            // See https://github.com/facebook/docusaurus/issues/9754
            // Large Docusaurus sites have many routes!
            // We try to minimize calls to a possibly expensive matchRoutes function
            validPathnames.add(pathname);
            return true;
        }
        return false;
    }
    function isPathBrokenLink(linkPath) {
        const pathnames = [linkPath.pathname, decodeURI(linkPath.pathname)];
        if (pathnames.some((p) => validPathnames.has(p))) {
            return false;
        }
        if (pathnames.some(isPathnameMatchingAnyRoute)) {
            return false;
        }
        return true;
    }
    function isAnchorBrokenLink(linkPath) {
        const { pathname, hash } = linkPath;
        // Link has no hash: it can't be a broken anchor link
        if (hash === undefined) {
            return false;
        }
        // Link has empty hash ("#", "/page#"...): we do not report it as broken
        // Empty hashes are used for various weird reasons, by us and other users...
        // See for example: https://github.com/facebook/docusaurus/pull/6003
        if (hash === '') {
            return false;
        }
        const targetPage = collectedLinks.get(pathname) ??
            collectedLinks.get(decodeURI(pathname)) ??
            // The broken link checker should not care about a trailing slash
            // Those are already covered by the broken pathname checker
            // See https://github.com/facebook/docusaurus/issues/10116
            collectedLinks.get((0, utils_common_1.addTrailingSlash)(pathname)) ??
            collectedLinks.get((0, utils_common_1.addTrailingSlash)(decodeURI(pathname))) ??
            collectedLinks.get((0, utils_common_1.removeTrailingSlash)(pathname)) ??
            collectedLinks.get((0, utils_common_1.removeTrailingSlash)(decodeURI(pathname)));
        // link with anchor to a page that does not exist (or did not collect any
        // link/anchor) is considered as a broken anchor
        if (!targetPage) {
            return true;
        }
        // it's a not broken anchor if the anchor exists on the target page
        if (targetPage.anchors.has(hash) ||
            targetPage.anchors.has(decodeURIComponent(hash))) {
            return false;
        }
        return true;
    }
    return {
        collectedLinks,
        isPathBrokenLink,
        isAnchorBrokenLink,
    };
}
function getBrokenLinksForPage({ pagePath, helper, }) {
    const pageData = helper.collectedLinks.get(pagePath);
    const brokenLinks = [];
    pageData.links.forEach((link) => {
        const linkPath = (0, utils_1.parseURLPath)(link, pagePath);
        if (helper.isPathBrokenLink(linkPath)) {
            brokenLinks.push({
                link,
                resolvedLink: (0, utils_1.serializeURLPath)(linkPath),
                anchor: false,
            });
        }
        else if (helper.isAnchorBrokenLink(linkPath)) {
            brokenLinks.push({
                link,
                resolvedLink: (0, utils_1.serializeURLPath)(linkPath),
                anchor: true,
            });
        }
    });
    return brokenLinks;
}
/**
 * The route defs can be recursive, and have a parent match-all route. We don't
 * want to match broken links like /docs/brokenLink against /docs/*. For this
 * reason, we only consider the "final routes" that do not have subroutes.
 * We also need to remove the match-all 404 route
 */
function filterIntermediateRoutes(routesInput) {
    const routesWithout404 = routesInput.filter((route) => route.path !== '*');
    return (0, utils_1.flattenRoutes)(routesWithout404);
}
function getBrokenLinks({ collectedLinks, routes, }) {
    const filteredRoutes = filterIntermediateRoutes(routes);
    const helper = createBrokenLinksHelper({
        collectedLinks,
        routes: filteredRoutes,
    });
    const result = {};
    collectedLinks.forEach((_unused, pagePath) => {
        try {
            result[pagePath] = getBrokenLinksForPage({
                pagePath,
                helper,
            });
        }
        catch (e) {
            throw new Error(`Unable to get broken links for page ${pagePath}.`, {
                cause: e,
            });
        }
    });
    return result;
}
function brokenLinkMessage(brokenLink) {
    const showResolvedLink = brokenLink.link !== brokenLink.resolvedLink;
    return `${brokenLink.link}${showResolvedLink ? ` (resolved as: ${brokenLink.resolvedLink})` : ''}`;
}
function createBrokenLinksMessage(pagePath, brokenLinks) {
    const type = brokenLinks[0]?.anchor === true ? 'anchor' : 'link';
    const anchorMessage = brokenLinks.length > 0
        ? `- Broken ${type} on source page path = ${pagePath}:
   -> linking to ${brokenLinks
            .map(brokenLinkMessage)
            .join('\n   -> linking to ')}`
        : '';
    return `${anchorMessage}`;
}
function createBrokenAnchorsMessage(brokenAnchors) {
    if (Object.keys(brokenAnchors).length === 0) {
        return undefined;
    }
    return `Docusaurus found broken anchors!

Please check the pages of your site in the list below, and make sure you don't reference any anchor that does not exist.
Note: it's possible to ignore broken anchors with the 'onBrokenAnchors' Docusaurus configuration, and let the build pass.

Exhaustive list of all broken anchors found:
${Object.entries(brokenAnchors)
        .map(([pagePath, brokenLinks]) => createBrokenLinksMessage(pagePath, brokenLinks))
        .join('\n')}
`;
}
function createBrokenPathsMessage(brokenPathsMap) {
    if (Object.keys(brokenPathsMap).length === 0) {
        return undefined;
    }
    /**
     * If there's a broken link appearing very often, it is probably a broken link
     * on the layout. Add an additional message in such case to help user figure
     * this out. See https://github.com/facebook/docusaurus/issues/3567#issuecomment-706973805
     */
    function getLayoutBrokenLinksHelpMessage() {
        const flatList = Object.entries(brokenPathsMap).flatMap(([pagePage, brokenLinks]) => brokenLinks.map((brokenLink) => ({ pagePage, brokenLink })));
        const countedBrokenLinks = lodash_1.default.countBy(flatList, (item) => item.brokenLink.link);
        const FrequencyThreshold = 5; // Is this a good value?
        const frequentLinks = Object.entries(countedBrokenLinks)
            .filter(([, count]) => count >= FrequencyThreshold)
            .map(([link]) => link);
        if (frequentLinks.length === 0) {
            return '';
        }
        return logger_1.default.interpolate `

It looks like some of the broken links we found appear in many pages of your site.
Maybe those broken links appear on all pages through your site layout?
We recommend that you check your theme configuration for such links (particularly, theme navbar and footer).
Frequent broken links are linking to:${frequentLinks}`;
    }
    return `Docusaurus found broken links!

Please check the pages of your site in the list below, and make sure you don't reference any path that does not exist.
Note: it's possible to ignore broken links with the 'onBrokenLinks' Docusaurus configuration, and let the build pass.${getLayoutBrokenLinksHelpMessage()}

Exhaustive list of all broken links found:
${Object.entries(brokenPathsMap)
        .map(([pagePath, brokenPaths]) => createBrokenLinksMessage(pagePath, brokenPaths))
        .join('\n')}
`;
}
function splitBrokenLinks(brokenLinks) {
    const brokenPaths = {};
    const brokenAnchors = {};
    Object.entries(brokenLinks).forEach(([pathname, pageBrokenLinks]) => {
        const [anchorBrokenLinks, pathBrokenLinks] = lodash_1.default.partition(pageBrokenLinks, (link) => link.anchor);
        if (pathBrokenLinks.length > 0) {
            brokenPaths[pathname] = pathBrokenLinks;
        }
        if (anchorBrokenLinks.length > 0) {
            brokenAnchors[pathname] = anchorBrokenLinks;
        }
    });
    return { brokenPaths, brokenAnchors };
}
function reportBrokenLinks({ brokenLinks, onBrokenLinks, onBrokenAnchors, }) {
    // We need to split the broken links reporting in 2 for better granularity
    // This is because we need to report broken path/anchors independently
    // For v3.x retro-compatibility, we can't throw by default for broken anchors
    // TODO Docusaurus v4: make onBrokenAnchors throw by default?
    const { brokenPaths, brokenAnchors } = splitBrokenLinks(brokenLinks);
    const pathErrorMessage = createBrokenPathsMessage(brokenPaths);
    if (pathErrorMessage) {
        logger_1.default.report(onBrokenLinks)(pathErrorMessage);
    }
    const anchorErrorMessage = createBrokenAnchorsMessage(brokenAnchors);
    if (anchorErrorMessage) {
        logger_1.default.report(onBrokenAnchors)(anchorErrorMessage);
    }
}
// Users might use the useBrokenLinks() API in weird unexpected ways
// JS users might call "collectLink(undefined)" for example
// TS users might call "collectAnchor('#hash')" with/without #
// We clean/normalize the collected data to avoid obscure errors being thrown
// We also use optimized data structures for a faster algorithm
function normalizeCollectedLinks(collectedLinks) {
    const result = new Map();
    Object.entries(collectedLinks).forEach(([pathname, pageCollectedData]) => {
        result.set(pathname, {
            links: new Set(pageCollectedData.links.filter(lodash_1.default.isString)),
            anchors: new Set(pageCollectedData.anchors
                .filter(lodash_1.default.isString)
                .map((anchor) => (anchor.startsWith('#') ? anchor.slice(1) : anchor))),
        });
    });
    return result;
}
async function handleBrokenLinks({ collectedLinks, onBrokenLinks, onBrokenAnchors, routes, }) {
    if (onBrokenLinks === 'ignore' && onBrokenAnchors === 'ignore') {
        return;
    }
    const brokenLinks = getBrokenLinks({
        routes,
        collectedLinks: normalizeCollectedLinks(collectedLinks),
    });
    reportBrokenLinks({ brokenLinks, onBrokenLinks, onBrokenAnchors });
}
