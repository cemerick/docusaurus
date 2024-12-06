import type { OptionValidationContext } from '@docusaurus/types';
export type PluginOptions = {
    rsdoctorOptions: Record<string, unknown>;
};
export type Options = {
    rsdoctorOptions?: Record<string, unknown>;
};
export declare const DEFAULT_OPTIONS: Partial<PluginOptions>;
export declare function validateOptions({ validate, options, }: OptionValidationContext<Options | undefined, PluginOptions>): PluginOptions;
