import { getUniversalRouter } from '../../Router';
import { __HAPLOID_ROUTER__ } from '../../constant';

describe.only(`allow-conflict`, () => {
    it(`allow conflict with global.value`, () => {
        Reflect.defineProperty(window, __HAPLOID_ROUTER__, {
            value: 1,
        });
        expect(getUniversalRouter).toThrow();
    });

    it(`allow conflict with global.get`, () => {
        Reflect.defineProperty(window, __HAPLOID_ROUTER__, {
            get() {
                return true;
            },
        });
        expect(getUniversalRouter).toThrow();
    });

    it(`allow conflict with global.set`, () => {
        Reflect.defineProperty(window, __HAPLOID_ROUTER__, {
            set() {},
        });
        expect(getUniversalRouter).toThrow();
    });

    it(`allow version conflict with global`, () => {
        Reflect.defineProperty(window, __HAPLOID_ROUTER__, {
            value: {
                version: 87558,
            },
        });
        expect(getUniversalRouter).toThrow();
    });
});
