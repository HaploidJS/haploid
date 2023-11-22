import { getUniversalRouter } from '../../Router';
import { __HAPLOID_ROUTER__ } from '../../constant';

describe.only(`single-instance`, () => {
    beforeAll(() => {
        getUniversalRouter();
    });

    it(`only one router instance created`, () => {
        expect(getUniversalRouter()).toBe(getUniversalRouter());
    });

    it(`define ${__HAPLOID_ROUTER__} under window`, () => {
        expect(window[__HAPLOID_ROUTER__]).toBe(getUniversalRouter());
    });

    it(`window.${__HAPLOID_ROUTER__} is not configurable/enumerable/writable`, () => {
        const des = Object.getOwnPropertyDescriptor(window, __HAPLOID_ROUTER__);
        expect(des?.configurable).toBe(false);
        expect(des?.enumerable).toBe(false);
        expect(des?.writable).toBe(false);
    });

    it(`has an idempotent version getter on prototype`, () => {
        const router = getUniversalRouter();
        const des = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(router), 'version');
        expect(des?.get).toBeTruthy();
        expect(des?.set).toBeFalsy();

        expect(router.version).toBe(router.version);
    });
});
