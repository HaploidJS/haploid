import { AppState, App } from '../../App';

describe.only(`safe-properties`, () => {
    const app = new App<Record<never, never>, { user: string }>({
        name: 'foo',
        customProps: (): { user: string } => ({
            user: 'jake',
        }),
    });

    it(`has a readonly name property`, () => {
        expect(app.name).toBe('foo');
        expect(Reflect.set(app, 'name', 'bar')).toBe(false);
    });

    it(`has a readonly hooks property`, () => {
        expect(app.hooks).not.toBeNull();
        expect(Reflect.set(app, 'hooks', 'bar')).toBe(false);
        expect(Object.isFrozen(app.hooks)).toBe(true);
    });

    it(`has a readonly options property`, () => {
        expect(app.options).toMatchObject({
            name: 'foo',
            entry: 'x',
        });
        expect(Reflect.set(app, 'options', {})).toBe(false);
    });

    it(`has a readonly lifecycle.fns property`, () => {
        expect(Reflect.set(app, 'lifecycle', 'bar')).toBe(false);
        expect(Reflect.set(app.lifecycle, 'fns', 'bar')).toBe(false);
    });

    it(`has a readonly state property`, () => {
        expect(app.state).toBe(AppState.NOT_LOADED);
        expect(Reflect.set(app, 'state', AppState.BOOTSTRAPPING)).toBe(false);
    });

    it(`has an readonly customProps property`, () => {
        expect(app.lifecycle.customProps).toEqual({
            user: 'jake',
        });
        expect(Reflect.set(app.lifecycle, 'customProps', {})).toBe(false);
    });
});
