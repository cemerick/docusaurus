/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import Rspack from '@rspack/core';
import * as lightningcss from 'lightningcss';
import { minify as swcHtmlMinifier } from '@swc/html';
import type { JsMinifyOptions, Options as SwcOptions } from '@swc/core';
export declare const swcLoader: string;
export declare const getSwcLoaderOptions: ({ isServer, }: {
    isServer: boolean;
}) => SwcOptions;
export declare const rspack: typeof Rspack;
export declare function getSwcHtmlMinifier(): typeof swcHtmlMinifier;
export declare function getSwcJsMinimizerOptions(): JsMinifyOptions;
export declare function getBrowserslistQueries({ isServer, }: {
    isServer: boolean;
}): string[];
type LightningCssMinimizerOptions = Omit<lightningcss.TransformOptions<never>, 'filename' | 'code'>;
export declare function getLightningCssMinimizerOptions(): LightningCssMinimizerOptions;
export {};
//# sourceMappingURL=index.d.ts.map