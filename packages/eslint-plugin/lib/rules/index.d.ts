/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
declare const _default: {
    'no-untranslated-text': import("@typescript-eslint/utils/dist/ts-eslint").RuleModule<"translateChildren", [{
        ignoredStrings: string[];
    }], import("@typescript-eslint/utils/dist/ts-eslint").RuleListener>;
    'string-literal-i18n-messages': import("@typescript-eslint/utils/dist/ts-eslint").RuleModule<"translateChildren" | "translateArg", [], import("@typescript-eslint/utils/dist/ts-eslint").RuleListener>;
    'no-html-links': import("@typescript-eslint/utils/dist/ts-eslint").RuleModule<"link", [{
        ignoreFullyResolved: boolean;
    }], import("@typescript-eslint/utils/dist/ts-eslint").RuleListener>;
    'prefer-docusaurus-heading': import("@typescript-eslint/utils/dist/ts-eslint").RuleModule<"headings", [], import("@typescript-eslint/utils/dist/ts-eslint").RuleListener>;
};
export default _default;
