import './plugins/AttachDOMPlugin';
import './plugins/IgnoreUnmountFailurePlugin';
import './plugins/LoadFromAssetsMapPlugin';
import './plugins/LoadFromEntryPlugin';
import './plugins/PreloadPlugin';
import './plugins/RetryLoadingSourceCodePlugin';
import './plugins/SafeModePlugin';

export type { App, AppAPI, AppHooks } from './App';
export { AppState, AppEvent } from './App';
export { LifecycleEvent, LifecycleHistory } from './Lifecycle';
export type { Lifecycle, LifecycleAPI } from './Lifecycle';
export type {
    AppOptions,
    DocumentOptions,
    WindowOptions,
    LifecycleOptions,
    AppPluginOptions,
    AppPluginOptionsWithGeneric,
    FixedLifecycleProps,
    AppLocation,
    LifecycleFn,
    LifecycleFns,
    AppTimeouts,
    Activity,
    ActivityFn,
    KeepAlive,
    Sandbox,
    ResourceFetchingOptions,
} from './Def';
export * from './Container';
export { ManualContainer } from './ManualContainer';
export { RouterContainer } from './RouterContainer';
export type { CancelationRouterNavigation, RouterAppOptions } from './RouterContainer';
export { navigateToUrl } from './utils/navigateToUrl';
export { type Transformable, normalizeTransformable } from './utils/Transformable';
export type { AppPlugin } from './Plugin';
export { AssetsModule, AssetsMap, FullAssetsMap } from './AssetsMap';
export { getUniversalDevTool, DevTool } from './DevTool';
export { Atomic, getUniversalAtomic } from './Atomic';
export { getUniversalRouter, Router } from './Router';
export { getUniversalUmdExportResolver, UmdExportResolver } from './UmdExportResolver';

export { registerWebComponents } from './web-components';
export type { ParsedAppOptions, AppElement, ContainerElement } from './web-components';
