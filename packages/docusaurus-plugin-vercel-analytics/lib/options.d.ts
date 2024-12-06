import type { OptionValidationContext } from '@docusaurus/types';
export type PluginOptions = {
    id: string;
    mode: 'auto' | 'production' | 'development' | undefined;
    debug: boolean | undefined;
};
export type Options = Partial<PluginOptions>;
export declare function validateOptions({ validate, options, }: OptionValidationContext<Options, PluginOptions>): PluginOptions;
