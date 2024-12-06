/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { DEFAULT_PLUGIN_ID } from '@docusaurus/utils';
import logger from '@docusaurus/logger';
import { Joi } from '@docusaurus/utils-validation';
const pluginOptionsSchema = Joi.object({
    mode: Joi.string().valid('auto', 'production', 'development').optional(),
    debug: Joi.boolean().optional(),
});
// We can't validate this through the schema
// Docusaurus core auto registers the id field to the schema already
function ensureNoMultiInstance(options) {
    if (options?.id && options.id !== DEFAULT_PLUGIN_ID) {
        throw new Error(logger.interpolate `You site uses the Vercel Analytics plugin with a custom plugin id (name=${options.id}).
      But this plugin is only supposed to be used at most once per site. Therefore providing a custom plugin id is unsupported.`);
    }
}
export function validateOptions({ validate, options, }) {
    ensureNoMultiInstance(options);
    return validate(pluginOptionsSchema, options);
}
