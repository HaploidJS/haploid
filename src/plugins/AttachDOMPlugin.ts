import type { AppPlugin } from '../Plugin';
import type { KeepAlive } from '../Def';
import { AppState } from '../App';

declare module '../Def' {
    interface AppPluginOptions {
        /** Enable keep-alive mode, which makes app not be unmounted when stopped.*/
        keepAlive?: KeepAlive;
        /** DOM element that app mounts at. */
        portalElement?: HTMLElement;
    }

    interface LifecycleFns<ExtraProps> {
        suspend?: LifecycleFn<ExtraProps> | Array<LifecycleFn<ExtraProps>>;
        resume?: LifecycleFn<ExtraProps> | Array<LifecycleFn<ExtraProps>>;
    }
}

function getRootElement(rootDOM: Element | string): HTMLElement {
    let root: HTMLElement | null;
    if ('string' === typeof rootDOM) {
        root = document.querySelector(rootDOM) as HTMLElement;
        if (!root) {
            throw Error(`Cannot find rootDOM ${rootDOM}.`);
        }
    } else if (rootDOM instanceof HTMLElement) {
        root = rootDOM;
    } else {
        throw Error(`The rootDOM need to be a selector or an element.`);
    }

    return root;
}

const parseKeepAlive = (keepAlive?: KeepAlive): Exclude<KeepAlive, boolean> | undefined => {
    switch (keepAlive) {
        case true:
            return {};
        case false:
        case null:
        case undefined:
            return undefined;
    }

    let useHiddenClass = '';

    if ('string' === typeof keepAlive.useHiddenClass) {
        useHiddenClass =
            'undefined' === typeof CSS ? keepAlive.useHiddenClass.trim() : CSS.escape(keepAlive.useHiddenClass.trim());
    } else {
        if ('undefined' !== typeof keepAlive.useHiddenClass) {
            console.warn(`useHiddenClass can only be a string, but it's ${typeof useHiddenClass}.`);
        }
        useHiddenClass = '';
    }

    let useHiddenAttribute = keepAlive.useHiddenAttribute;

    if ('boolean' !== typeof useHiddenAttribute && 'undefined' !== typeof useHiddenAttribute) {
        console.warn(`useHiddenAttribute can only be a boolean, but it's ${typeof useHiddenAttribute}.`);
        useHiddenAttribute = false;
    }

    let detachDOM = keepAlive.detachDOM;

    if ('boolean' !== typeof detachDOM && 'undefined' !== typeof detachDOM) {
        console.warn(`detachDOM can only be a boolean, but it's ${typeof detachDOM}.`);
        detachDOM = false;
    }

    return {
        ...keepAlive,
        useHiddenClass,
        useHiddenAttribute,
        detachDOM,
    };
};

const PLUGIN_NAME = 'AttachDOMPlugin';
const ANYTHING_NOT_UNDEF = true;

export function createAttachDOMPlugin<AdditionalOptions, CustomProps>(
    rootDOM: Element | string
): AppPlugin<AdditionalOptions, CustomProps> {
    return ({ app, debug }) => {
        let everMounted = false;
        const wrapperCommentPlaceholder: Comment = document.createComment(` placeholder of ${app.name} `);

        const resolveRootDOM = ((): (() => HTMLElement) => {
            let rootElement: HTMLElement | null = null;
            return (): HTMLElement => {
                if (rootElement) {
                    return rootElement;
                }

                if (app.options.portalElement) {
                    rootElement = app.options.portalElement;
                } else {
                    rootElement = getRootElement(rootDOM);
                }
                return rootElement;
            };
        })();

        app.lifecycle.hooks.aftermount.tap(PLUGIN_NAME, () => {
            everMounted = true;
        });

        const keepAliveOption = parseKeepAlive(app.options.keepAlive);

        if (keepAliveOption) {
            app.lifecycle.hooks.mount.tapPromise(PLUGIN_NAME, () => {
                if (everMounted) {
                    debug('Call resume instead of mount in keepAlive mode.');
                    return app.lifecycle.fns
                        .call('resume', app.lifecycle.customProps, true)
                        .then(() => ANYTHING_NOT_UNDEF);
                }
                return Promise.resolve();
            });

            app.lifecycle.hooks.unmount.tapPromise(PLUGIN_NAME, () => {
                if (app.state === AppState.UNLOADING) {
                    return Promise.resolve();
                }
                debug('Call suspend instead of unmount in keepAlive mode.');
                return app.lifecycle.fns
                    .call('suspend', app.lifecycle.customProps, true)
                    .then(() => ANYTHING_NOT_UNDEF);
            });
        }

        let preDisplay = '';

        app.lifecycle.hooks.beforemount.tap(PLUGIN_NAME, () => {
            if (!app.appElement) {
                return;
            }

            if (keepAliveOption && everMounted && !keepAliveOption.detachDOM) {
                debug("Don't need to attach DOM if ever mounted in keepAlive mode, instead we show it.");
                const { useHiddenAttribute, useHiddenClass } = keepAliveOption;

                if (useHiddenAttribute) {
                    app.appElement.removeAttribute('hidden');
                }

                if (useHiddenClass) {
                    app.appElement.classList.remove(useHiddenClass);
                }

                if (!useHiddenAttribute && !useHiddenClass) {
                    app.appElement.style.display = preDisplay;
                }

                return;
            }

            const rootElement = resolveRootDOM();
            debug('Attach appElement(%o) to rootDOM(%o).', app.appElement, rootElement);

            if (wrapperCommentPlaceholder.parentElement === rootElement) {
                wrapperCommentPlaceholder.replaceWith(app.appElement);
            } else {
                rootElement.appendChild(app.appElement);
            }
        });

        app.lifecycle.hooks.afterunmount.tap(PLUGIN_NAME, () => {
            if (!app.appElement) {
                return;
            }

            if (keepAliveOption && app.state !== AppState.UNLOADING && !keepAliveOption.detachDOM) {
                debug("Don't detach DOM in keepAlive mode, instead we hide it.");
                const { useHiddenAttribute, useHiddenClass } = keepAliveOption;

                if (useHiddenAttribute) {
                    app.appElement.setAttribute('hidden', 'hidden');
                }

                if (useHiddenClass) {
                    app.appElement.classList.add(useHiddenClass);
                }

                if (!useHiddenAttribute && !useHiddenClass) {
                    preDisplay = app.appElement.style.display;
                    app.appElement.style.display = 'none';
                }

                return;
            }

            const rootElement = resolveRootDOM();
            debug('Detach appElement(%o) from rootDOM(%o).', app.appElement, rootElement);

            // Don't use parentElement/parentNode
            app.appElement.replaceWith(wrapperCommentPlaceholder);

            if (!keepAliveOption) {
                everMounted = false;
            }
        });

        app.hooks.afterunload.tap(PLUGIN_NAME, () => {
            wrapperCommentPlaceholder.remove();
        });
    };
}
