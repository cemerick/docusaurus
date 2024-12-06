/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { SVGRConfig } from './options';
import type { RuleSetRule } from 'webpack';
type Params = {
    isServer: boolean;
    svgrConfig: SVGRConfig;
};
export declare function createLoader(params: Params): RuleSetRule;
export {};
