import type { AsyncSeriesBailHook } from '../../tapable/index';
import type { DocumentOptions, WindowOptions } from '../../Def';

export interface NodeShadow<T> {
    get node(): T;
    get shadow(): Record<PropertyKey, unknown>;
    onLoading(): void;
    onLoad(): void;
    onDestroy(): void;
}

export type DocumentNodeHooks = {
    scriptappended: AsyncSeriesBailHook<HTMLScriptElement, void>;
    linkappended: AsyncSeriesBailHook<HTMLLinkElement, void>;
};

export interface DocumentShadow extends NodeShadow<Document> {
    hooks: DocumentNodeHooks;
    get htmlElement(): HTMLElement;
    get bodyElement(): HTMLElement;
    get headElement(): HTMLElement;
    get titleElement(): HTMLElement;
    createPseudoScriptElement(): HTMLScriptElement;
    toggleVisibilityState(visibilityState: DocumentVisibilityState): void;
}

export interface WindowShadow extends NodeShadow<Window> {
    get documentShadow(): DocumentShadow;
}

export type { DocumentOptions, WindowOptions };
