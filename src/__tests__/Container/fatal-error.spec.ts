import { RouterContainer } from '../../index';
import { __HAPLOID_ROUTER__, HAPLOID_ROUTER_VERSION } from '../../constant';

describe.only(`fatal-error`, () => {
    it(`run() router throws if router version mismatch`, async () => {
        Reflect.defineProperty(window, __HAPLOID_ROUTER__, {
            value: {
                version: HAPLOID_ROUTER_VERSION + 1,
            },
        });

        const container = new RouterContainer({
            name: 'root',
            root: '#app',
        });

        expect(() => container.run()).toThrow(/in conflict with/);
    });
});
