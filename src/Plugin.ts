import type debug from 'debug';
import type { AppAPI } from './App';

export type AppPlugin<AdditionalOptions, CustomProps> = (opts: {
    app: AppAPI<AdditionalOptions, CustomProps>;
    debug: ReturnType<debug.Debug>;
}) => void;
