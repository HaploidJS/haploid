import pkg from '../package.json';

import type { AppTimeouts } from './Def';

export const SDK_NAME = pkg.name.split('/').pop();
export const SDK_VERSION: string = pkg.version;

export const DEFAULT_HAPLOID_MAX_LOAD_CONCURRENCY = 4;

// global factory
export const __HAPLOID_ROUTER__ = '__HAPLOID_ROUTER__';
export const __HAPLOID_ATOMIC__ = '__HAPLOID_ATOMIC__';
export const __HAPLOID_APP_LOAD_ATOMIC__ = '__HAPLOID_APP_LOAD_ATOMIC__';
export const __HAPLOID_RESOURCE_MANAGER__ = '__HAPLOID_RESOURCE_MANAGER__';
export const __HAPLOID_UMD_EXPORT_RESOLVER__ = '__HAPLOID_UMD_EXPORT_RESOLVER__';
export const __HAPLOID_DOWNLOADER__ = '__HAPLOID_DOWNLOADER__';
export const __HAPLOID_DEV_TOOL__ = '__HAPLOID_DEV_TOOL__';

// global map
export const __HAPLOID_GLOBAL_MAP_UMD_EXPORTED__ = '__HAPLOID_GLOBAL_MAP_UMD_EXPORTED__';
export const __HAPLOID_GLOBAL_MAP_DOM_CONTAINER__ = '__HAPLOID_GLOBAL_MAP_DOM_CONTAINER__';
export const __HAPLOID_GLOBAL_MAP_DOWNLOADER__ = '__HAPLOID_GLOBAL_MAP_DOWNLOADER__';

export const HAPLOID_ROUTER_VERSION = 0x101;
export const HAPLOID_RESOURCE_MANAGER_VERSION = 0x201;
export const HAPLOID_UMD_EXPORT_RESOLVER_VERSION = 0x301;
export const HAPLOID_DEV_TOOL_VERSION = 0x401;
export const HAPLOID_DOWNLOADER_VERSION = 0x501;
export const HAPLOID_ATOMIC_VERSION = 0x601;

export const DEFAULE_TIMEOUTS: AppTimeouts = {
    load: 5000,
    bootstrap: 4000,
    mount: 3000,
    unmount: 3000,
    update: 3000,
};

export const UNDER_TEST: boolean = navigator.userAgent.includes('jsdom/');
