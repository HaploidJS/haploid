import type { Router } from './Router';
import type { UmdExportResolver } from './UmdExportResolver';
import type { DevTool } from './DevTool';
import type { Downloader } from './Downloader';
import type { Atomic } from './Atomic';

declare global {
    interface Window {
        __HAPLOID_DISABLE_DEADLOOP_DETECT__?: boolean;
        __HAPLOID_MAX_LOAD_CONCURRENCY__?: number;
        __HAPLOID_MAP__: Map<PropertyKey, Map<unknown, unknown>>;
        __HAPLOID_ROUTER__: Router;
        __HAPLOID_UMD_EXPORT_RESOLVER__: UmdExportResolver;
        __HAPLOID_DEV_TOOL__: DevTool;
        __HAPLOID_DOWNLOADER__: Downloader;
        __HAPLOID_ATOMIC__: Atomic;
        __HAPLOID_APP_LOAD_ATOMIC__: Atomic;
    }
}

export {};
