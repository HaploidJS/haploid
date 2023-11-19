import type { Router } from './Router';
import type { GlobalExportResolver } from './GlobalExportResolver';
import type { DevTool } from './DevTool';
import type { Downloader } from './Downloader';
import type { Atomic } from './Atomic';

declare global {
    interface Window {
        __HAPLOID_DISABLE_DEADLOOP_DETECT__?: boolean;
        __HAPLOID_MAX_LOAD_CONCURRENCY__?: number;
        __HAPLOID_MAP__: Map<PropertyKey, Map<unknown, unknown>>;
        __HAPLOID_ROUTER__: Router;
        __HAPLOID_GLOBAL_EXPORT_RESOLVER__: GlobalExportResolver;
        __HAPLOID_DEV_TOOL__: DevTool;
        __HAPLOID_DOWNLOADER__: Downloader;
        __HAPLOID_ATOMIC__: Atomic;
        __HAPLOID_APP_LOAD_ATOMIC__: Atomic;
    }
}

export {};
