<div align="center">

### High-Concurrency.Multiple-Instances. Micro-Frontend

![build status](https://github.com/HaploidJS/haploid/actions/workflows/check-build.yml/badge.svg) ![publish status](https://github.com/HaploidJS/haploid/actions/workflows/publish-npm.yml/badge.svg)

</div>

---

Haploid is a high-concurrency and multiple-instances [micro-frontend](https://micro-frontends.org/) framework inspired by and compatible with [single-spa](https://single-spa.js.org/).

## Features

-   [x] compatible with single-spa
-   [x] multiple instances
-   [x] router & manual modes
-   [x] safe destroying
-   [x] safe nested
-   [x] async navigation cancelation
-   [x] fast reaction in concurrency
-   [x] multiple types of application entry
-   [x] built-in ESM loading
-   [x] unified resources management
-   [x] more chances for retry
-   [x] keep-alive
-   [x] preload(intelligent optional)
-   [x] dead loop detect
-   [x] JS sandbox

## Usage

### router mode

```ts
const { RouterContainer } from 'haploid';

const container = new RouterContainer({
    name: 'top',
    root: '#app',
    fallbackUrl: '/foo',
    fallbackOnlyWhen: loc => loc.pathname === '/',
    cancelActivateApp: (app) => Promise.resolve(false),
});

const [fooApp, barApp, bazApp] = container.registerApps([
    {
        // use entry
        name: 'foo',
        entry: '/foo-config/assets.json',
        activeWhen: '/foo',
    },
    {
        // use assetsMap
        name: 'bar',
        entry: '/foo-config/assets.json',
        assetsMap: { module: 'esm', initial: {}, async: {} },
        activeWhen: (location: Location) => location.pathname.startsWith('/foo'),
    },
    {
        // use lifecycle
        name: 'baz',
        lifecycle: {
            mount: async () => {},
            unmount: async () => {},
            bootstrap: async () => {},
        },
        activeWhen: ['/baz', '/bas'],
    }
]);

container.on('appactivating', ({ appname }) => {});
container.on('appactivated', ({ appname }) => {});
container.on('appactivateerror', ({ appname, error }) => {});
container.on('noappactivated', ({ error }) => {}); // No emitted if fallback.

container.run();

await container.destroy();
```

> 💡 Once a RouterContainer starts running, a popstate event will be dispatched after `pushState` or `replaceState` called, which changes the default behavior of browser.

### manual mode

```ts
const { ManualContainer } from 'haploid';

const container = new ManualContainer({
    name: 'top',
    root: '#app',
});

const [fooApp, barApp, bazApp] = container.registerApps([
    {
        // use entry
        name: 'foo',
        entry: '/foo-config/assets.json',
    },
    {
        // use assetsMap
        name: 'bar',
        entry: '/foo-config/assets.json',
        assetsMap: { module: 'esm', initial: {}, async: {} },
    },
    {
        // use lifecycle
        name: 'baz',
        lifecycle: {
            mount: async () => {},
            unmount: async () => {},
            bootstrap: async () => {},
        },
    }
]);

container.on('appactivating', ({ appname }) => {});
container.on('appactivated', ({ appname }) => {});
container.on('appactivateerror', ({ appname, error }) => {});
container.on('noappactivated', ({ error }) => {});

await container.activateApp('foo');

await container.destroy();
```

### events

```ts
fooApp.on('beforeload'), () => {});
fooApp.on('afterload'), () => {});
fooApp.on('loaderror'), ({ error: AppError }) => {});
fooApp.on('beforestart', () => {});
fooApp.on('afterstart', () => {});
fooApp.on('starterror', ({ error: AppError; prevState: AppState }) => {});
fooApp.on('beforestop', () => {});
fooApp.on('afterstop', () => {});
fooApp.on('stoperror', ({ error: AppError; prevState: AppState }) => {});
fooApp.on('beforeupdate', () => {});
fooApp.on('afterupdate', () => {});
fooApp.on('updateerror', ({ error: AppError; prevState: AppState }) => {});
fooApp.on('beforeunload', () => {});
fooApp.on('afterunload', () => {});

fooApp.lifecycle.on('beforebootstrap'), () => {});
fooApp.lifecycle.on('afterbootstrap'), () => {});
fooApp.lifecycle.on('bootstraperror'), ({ error: AppError }) => {});
fooApp.lifecycle.on('beforemount'), () => {});
fooApp.lifecycle.on('aftermount'), () => {});
fooApp.lifecycle.on('mountinterrupted'), ({ error: AppError }) => {});
fooApp.lifecycle.on('mounterror'), ({ error: AppError }) => {});
fooApp.lifecycle.on('beforeunmount'), () => {});
fooApp.lifecycle.on('afterunmount'), () => {});
fooApp.lifecycle.on('unmounterror'), ({ error: AppError }) => {});
fooApp.lifecycle.on('beforeupdate'), () => {});
fooApp.lifecycle.on('afterupdate'), () => {});
fooApp.lifecycle.on('updateinterrupted'), ({ error: AppError }) => {});
fooApp.lifecycle.on('updateerror'), ({ error: AppError}) => {});
```
