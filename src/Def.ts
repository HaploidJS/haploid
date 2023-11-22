import { Transformable } from './utils/Transformable';

export type CrossOrigin = 'anonymous' | 'use-credentials' | undefined | null;

export type KeepAlive =
    | boolean
    | {
          useHiddenAttribute?: boolean;
          useHiddenClass?: string;
          detachDOM?: boolean;
      };

export type IgnoreAsset = RegExp | Array<RegExp | ((src: string) => boolean)> | ((src: string) => boolean);

export type JSExportType = 'global' | 'esm' | 'module' | 'umd';

export type AppEntry = {
    url: string;
    retries?: number;
    requestInit?: RequestInit;
    timeout?: number;
};

export interface DocumentOptionsFromResolvingOnly {
    /** As Node.baseURI */
    baseURI?: string;
    /** As document.lastModified */
    lastModified?: string;
}

export interface DocumentOptionsFromSettingOnly {
    /**
     * Make &lt;haploid-html&gt; works like &lt;html&gt;:
     *
     * 1. tagName and nodeName are both "HTML";
     * 2. constructor is HTMLHtmlElement;
     * 3. instanceof HTMLHtmlElement returns true;
     * 4. has a version property equals "";
     * 5. parentNode is document(proxy object in sandbox);
     * 6. parentElement is null
     */
    enableHtmlPretending?: boolean;
    /**
     * Make &lt;haploid-title&gt; works like &lt;title&gt;:
     *
     * 1. tagName and nodeName are both "TITLE";
     * 2. constructor is HTMLTitleElement;
     * 3. instanceof HTMLTitleElement returns true;
     */
    enableTitlePretending?: boolean;
    /**
     * Make &lt;haploid-head&gt; works like &lt;head&gt;:
     *
     * 1. tagName and nodeName are both "HEAD";
     * 2. constructor is HTMLHeadElement;
     * 3. instanceof HTMLHeadElement returns true;
     */
    enableHeadPretending?: boolean;
    /**
     * Make &lt;haploid-body&gt; works like &lt;body&gt;:
     *
     * 1. tagName and nodeName are both "BODY";
     * 2. constructor is HTMLBodyElement;
     * 3. instanceof HTMLBodyElement returns true;
     */
    enableBodyPretending?: boolean;
    /**
     * Events that can be dispatched to raw document object.
     */
    escapeDocumentEvents?: string[];
    /**
     * Document events that can be compensated by sandbox lifecycle.
     */
    autoDocumentEvents?: Array<'readystatechange' | 'DOMContentLoaded'>;
}

export interface DocumentOptions extends DocumentOptionsFromSettingOnly, DocumentOptionsFromResolvingOnly {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WindowOptionsFromResolvingOnly {}

export interface WindowOptionsFromSettingOnly {
    /**
     * Variables that can be get/set to raw window object.
     */
    escapeVariables?: string[];
    /**
     * Events that can be dispatched to raw window object.
     */
    escapeWindowEvents?: string[];
    /**
     * Window events that can be compensated by sandbox lifecycle.
     */
    autoWindowEvents?: Array<'load' | 'beforeunload'>;
    /**
     * Override more properties.
     */
    patches?: {
        /**
         * Read/write scoped keys.
         */
        localStorage?: boolean;
        /**
         * Automatically abort when destroyed.
         */
        XMLHttpRequest?: boolean;
        /**
         * Automatically disconnect when destroyed.
         */
        MutationObserver?: boolean;
        /**
         * Automatically abort is no signal specified when destroyed.
         */
        fetch?: boolean;
        /**
         * Automatically clear when destroyed.
         */
        setTimeout?: boolean;
        /**
         * Automatically clear when destroyed.
         */
        setInterval?: boolean;
        /**
         * Automatically cancel when destroyed.
         */
        requestAnimationFrame?: boolean;
        /**
         * Automatically cancel when destroyed.
         */
        requestIdleCallback?: boolean;
        /**
         * TODO
         */
        eval?: boolean;
    };
}

export interface WindowOptions extends WindowOptionsFromSettingOnly, WindowOptionsFromResolvingOnly {}

export type Sandbox = boolean | (WindowOptionsFromSettingOnly & DocumentOptionsFromSettingOnly);

export interface ESEngineOptions {
    /** Enable strict mode, default is true. */
    useStrict?: boolean;
}

export interface ResourceFetchingOptions extends RequestInit {
    timeout?: number;
    retries?: number;
}

export interface ChromeOptionsFromSettingOnly {
    name: string;
    /** Sandbox settings. */
    sandbox?: Sandbox;
    /** Global variables when evalating JS. */
    envVariables?: Record<string, unknown>;
    /** Options when fetching JS and CSS. */
    fetchResourceOptions?: ResourceFetchingOptions | ((src: string) => ResourceFetchingOptions);
    /** Rewrite asset url. */
    urlRewrite?: (url: string) => string;
    /** If true, URL is fixed only by regular expression in CSS. */
    dropURLFixInCSSByStyleSheet?: boolean;
    /** Explicitly specify js export type. */
    jsExportType?: JSExportType;
    /** Require external modules. */
    externals?: Record<string, unknown>;
}

export interface ChromeOptionsFromResolvingOrSetting {
    /** Preset DOM string in &lt;haploid-head&gt;. */
    presetHeadHTML?: string;
    /** Preset DOM string in &lt;haploid-body&gt;. */
    presetBodyHTML?: string;
    /** Text string in &lt;haploid-title&gt;. */
    title?: string;
}

export interface OptionsFromResolving
    extends ChromeOptionsFromResolvingOrSetting,
        DocumentOptionsFromResolvingOnly,
        WindowOptionsFromResolvingOnly {}

/** As constructor parameter of Chrome. */
export interface ChromeOptions
    /* For Chrome itself. */
    extends ChromeOptionsFromSettingOnly,
        ChromeOptionsFromResolvingOrSetting,
        /* For DocumentShadow */
        DocumentOptionsFromResolvingOnly,
        /* For WindowShadow */
        WindowOptionsFromResolvingOnly,
        /* For ESEngine */
        ESEngineOptions {}

export interface LifecycleOptions<CustomProps> {
    name: string;
    timeouts?: Partial<LifecycleTimeouts>;
    customProps?: CustomProps | CustomPropsFn<CustomProps>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AppPluginOptions {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-unused-vars
export interface AppPluginOptionsWithGeneric<CustomProps> {}

export interface AppOptions<CustomProps>
    extends LifecycleOptions<CustomProps>,
        ChromeOptionsFromSettingOnly,
        ChromeOptionsFromResolvingOrSetting,
        ESEngineOptions,
        AppPluginOptions,
        AppPluginOptionsWithGeneric<CustomProps> {
    timeouts?: Partial<AppTimeouts>;
    lifecycle?: Transformable<LifecycleFns<CustomProps>>;
}

export interface LifecycleTimeouts {
    bootstrap: number;
    mount: number;
    update: number;
    unmount: number;
}

export interface AppTimeouts extends LifecycleTimeouts {
    load: number;
}

export type AppLocation = {
    hash: string;
    host: string;
    hostname: string;
    href: string;
    origin: string;
    pathname: string;
    port: string;
    protocol: string;
    search: string;
    toString(): string;
};

export type ActivityFn = (location: AppLocation) => boolean;

export type Activity = ActivityFn | string | (ActivityFn | string)[];

/* ############ respect to single-spa ############ */
export interface FixedLifecycleProps {
    name: string;
    domElement?: string | Element;
}

export type CustomPropsFn<CustomProps> = (name: string, location: Location) => CustomProps;

export type LifecycleFn<ExtraProps> = (config: ExtraProps & FixedLifecycleProps) => Promise<unknown>;

export interface LifecycleFns<ExtraProps> {
    bootstrap?: LifecycleFn<ExtraProps> | Array<LifecycleFn<ExtraProps>>;
    mount: LifecycleFn<ExtraProps> | Array<LifecycleFn<ExtraProps>>;
    unmount: LifecycleFn<ExtraProps> | Array<LifecycleFn<ExtraProps>>;
    update?: LifecycleFn<ExtraProps> | Array<LifecycleFn<ExtraProps>>;
}
