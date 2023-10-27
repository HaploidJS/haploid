import { createESEngine } from '@/chrome/ESEngine/';
import { WindowNode } from '@/chrome/BOM/';

describe.only('ScopedESEngine', () => {
    describe('env variables', () => {
        it('inject variables', () => {
            const engine = createESEngine(true, new WindowNode('test', { __DEV__: true }));

            expect(
                engine.execScript(`
            window.__DEV__
        `)
            ).toBe(true);

            // do not leak
            expect(Reflect.has(window, '__DEV__')).toBe(false);
        });

        it('works even env variable conflict', () => {
            Reflect.defineProperty(window, '__DEV__', {
                value: 6,
                writable: true,
                configurable: true,
            });

            const engine = createESEngine(true, new WindowNode('test', { __DEV__: true }));

            expect(
                engine.execScript(`
        __DEV__
        `)
            ).toBe(true);

            // recovered
            expect(Reflect.get(window, '__DEV__')).toBe(6);
        });

        it('do not throw if env variable conflict', () => {
            Reflect.defineProperty(window, '__DEV__', {
                value: 6,
                writable: true,
                // cannot modify
                configurable: false,
            });

            const engine = createESEngine(true, new WindowNode('test', { __DEV__: true }));

            expect(
                engine.execScript(`
        __DEV__
        `)
            ).toBe(true);
        });
    });

    describe('context join', () => {
        it(`share variables by var in scoped`, () => {
            const engine = createESEngine(true, new WindowNode('test', {}));

            engine.execScript(`
                var month = 9;
                var getVar = function() {
                    try {
                        return year
                    } catch {
                        return undefined
                    }
                };
            `);
            engine.execScript(`var year = 2018;`);
            engine.execScript(`
                const day = 28;
                let hour = 12;
            `);

            expect(engine.execScript('month')).toBe(9);
            expect(engine.execScript('year')).toBe(2018);

            // Cannot visit variables declared by let/const
            expect(engine.execScript('try{day}catch{}')).toBeUndefined();
            expect(engine.execScript('try{hour}catch{}')).toBeUndefined();

            // Variables hoisting not working
            expect(engine.execScript('getVar()')).toBeUndefined();

            // Not escape
            expect(Reflect.has(window, 'month')).toBe(false);
            expect(Reflect.has(window, 'year')).toBe(false);
            expect(Reflect.has(window, 'day')).toBe(false);
            expect(Reflect.has(window, 'hour')).toBe(false);
        });

        it.todo(`visit variables under window`);
    });
});
