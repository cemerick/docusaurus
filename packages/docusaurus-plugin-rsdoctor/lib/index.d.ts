/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { LoadContext, Plugin } from '@docusaurus/types';
import type { PluginOptions, Options } from './options';
declare const _default: (context: LoadContext, options: PluginOptions) => Promise<Plugin | null>;
export default _default;
export { validateOptions } from './options';
export type { PluginOptions, Options };
