import { navigateToUrl } from '@/index';
import { getUniversalRouter, RouterNavigation, RerouteConsumer, RerouteDescriptor } from '@/Router';
import { delay } from '../../../spec/test-utils';

describe.only(`happy-consume`, () => {
    const router = getUniversalRouter();

    beforeEach(() => {
        navigateToUrl('/');
        return delay(0);
    });

    it('rerouteBack successfully', async () => {
        let navigation: RouterNavigation | undefined = undefined;

        const resumer: RerouteConsumer = {
            async accept(descriptor: RerouteDescriptor): Promise<void> {
                navigation = descriptor.navigation;

                descriptor.cancelOneVoteVeto.veto();
            },
        };

        router.registerConsumer(resumer);

        navigateToUrl('/foo');
        await delay(0);
        expect(navigation).toMatchObject({
            newUrl: 'http://localhost/',
            oldUrl: 'http://localhost/',
            newState: null,
            oldState: null,
        });

        expect(location.pathname).toBe('/');

        router.unregisterConsumer(resumer);
    });

    it('rerouteBack continuously in order', async () => {
        const navigations: RouterNavigation[] = [];

        const resumer: RerouteConsumer = {
            async accept(descriptor: RerouteDescriptor): Promise<void> {
                navigations.push(descriptor.navigation);

                return delay(10).then(() => {
                    descriptor.cancelOneVoteVeto.veto();
                });
            },
        };

        router.registerConsumer(resumer);

        navigateToUrl('/foo');
        await delay(0);
        navigateToUrl('/bar');
        await delay(15);
        expect(navigations[navigations.length - 1]).toMatchObject({
            newUrl: 'http://localhost/',
            oldUrl: 'http://localhost/',
            newState: null,
            oldState: null,
        });

        expect(location.pathname).toBe('/');

        router.unregisterConsumer(resumer);
    });

    it('rerouteBack continuously in reverse order', async () => {
        const navigations: RouterNavigation[] = [];

        let t = 0;

        const resumer: RerouteConsumer = {
            async accept(descriptor: RerouteDescriptor): Promise<void> {
                navigations.push(descriptor.navigation);

                return delay((2 - t++) * 10).then(() => {
                    descriptor.cancelOneVoteVeto.veto();
                });
            },
        };

        router.registerConsumer(resumer);

        navigateToUrl('/foo');
        await delay(0);
        navigateToUrl('/bar');
        await delay(30);
        expect(navigations[navigations.length - 1]).toMatchObject({
            newUrl: 'http://localhost/',
            oldUrl: 'http://localhost/',
            newState: null,
            oldState: null,
        });

        expect(location.pathname).toBe('/');

        router.unregisterConsumer(resumer);
    });

    it(`callAllEvenListener not called if no tick`, async () => {
        const popstate = jest.fn();

        window.addEventListener('popstate', popstate);

        const resumer: RerouteConsumer = {
            async accept(): Promise<void> {},
        };

        router.registerConsumer(resumer);

        navigateToUrl('/foo');
        await delay(0);

        expect(popstate).not.toHaveBeenCalled();

        router.unregisterConsumer(resumer);

        window.removeEventListener('popstate', popstate);
    });

    it(`callAllEvenListener called successfully`, async () => {
        const popstate = jest.fn();
        const hashchange = jest.fn();

        window.addEventListener('popstate', popstate);
        window.addEventListener('hashchange', hashchange);

        const resumer: RerouteConsumer = {
            async accept(descriptor: RerouteDescriptor): Promise<void> {
                descriptor.cancelOneVoteVeto.pass();
                descriptor.domReadyCounter.count();
            },
        };

        router.registerConsumer(resumer);

        navigateToUrl('/foo');
        await delay(0);
        location.hash = '#foo';
        await delay(0);
        expect(popstate).toHaveBeenCalledTimes(2); // hashchange => popstate
        expect(hashchange).toHaveBeenCalledTimes(1);

        router.unregisterConsumer(resumer);
        window.removeEventListener('popstate', popstate);
        window.removeEventListener('hashchange', hashchange);
    });

    it(`fire the all delayed events before the current`, async () => {
        const popstate = jest.fn();

        window.addEventListener('popstate', popstate);

        const resumer: RerouteConsumer = {
            async accept(descriptor: RerouteDescriptor): Promise<void> {
                if (descriptor.navigation.newUrl.endsWith('/foo')) {
                    descriptor.cancelOneVoteVeto.veto();
                    return;
                }

                if (descriptor.navigation.newUrl.endsWith('/bar')) {
                    return;
                }

                if (descriptor.navigation.newUrl.endsWith('/baz')) {
                    descriptor.cancelOneVoteVeto.pass();
                    return;
                }

                descriptor.cancelOneVoteVeto.pass();
                descriptor.domReadyCounter.count();
            },
        };

        router.registerConsumer(resumer);

        navigateToUrl('/foo');
        await delay(0);
        navigateToUrl('/bar');
        await delay(0);
        navigateToUrl('/baz');
        await delay(0);
        navigateToUrl('/kmp');
        await delay(0);

        // /foo is cancelled, ignore its event.
        // /bar is hanged, treat it as passed.
        // /baz is leaked, but its event can still be flushed.
        expect(popstate).toHaveBeenCalledTimes(3);

        router.unregisterConsumer(resumer);
        window.removeEventListener('popstate', popstate);
    });
});
