import { ScriptNode } from '@/node/';

describe.only('script', () => {
    describe('isInline', () => {
        it('no src means inline', async () => {
            expect(
                new ScriptNode({
                    src: undefined,
                }).isInline
            ).toBe(true);
        });

        it('empty-string src means inline', async () => {
            expect(
                new ScriptNode({
                    src: '  ',
                }).isInline
            ).toBe(true);
        });
    });

    describe('content', () => {
        it('content is trimed', async () => {
            expect(
                new ScriptNode({
                    content: '  ',
                }).content
            ).toHaveLength(0);
        });
    });

    describe('isValid', () => {
        it('noModule is not valid', async () => {
            expect(
                new ScriptNode({
                    noModule: true,
                    content: 'x',
                }).isValid
            ).toBe(false);
        });
        it('no src and content is not valid', async () => {
            expect(new ScriptNode({}).isValid).toBe(false);
        });
        it('with src but no content is not valid', async () => {
            expect(new ScriptNode({ src: 'a.css' }).isValid).toBe(true);
        });
        it('with content but no src is not valid', async () => {
            expect(new ScriptNode({ content: 'x' }).isValid).toBe(true);
        });
        it('empty-string type is valid', async () => {
            expect(
                new ScriptNode({
                    type: ' ',
                    content: 'x',
                }).isValid
            ).toBe(true);
        });
        it('text/javascript type is valid', async () => {
            expect(
                new ScriptNode({
                    type: 'text/javascript ',
                    content: 'x',
                }).isValid
            ).toBe(true);
        });
        it('module type is valid', async () => {
            expect(
                new ScriptNode({
                    type: 'module ',
                    content: 'x',
                }).isValid
            ).toBe(true);
        });
        it('undefined type is valid', async () => {
            expect(
                new ScriptNode({
                    type: undefined,
                    content: 'x',
                }).isValid
            ).toBe(true);
        });
    });

    describe('isESM', () => {
        it('type=module means ESM', async () => {
            expect(
                new ScriptNode({
                    type: 'module',
                    content: 'x',
                }).isESM
            ).toBe(true);
        });
    });

    describe('isEntry', () => {
        it('entry=true means Entry', async () => {
            expect(
                new ScriptNode({
                    entry: true,
                    content: 'x',
                }).isEntry
            ).toBe(true);
        });
    });

    describe('isAsync', () => {
        it('async=true means Async', async () => {
            expect(
                new ScriptNode({
                    async: true,
                    content: 'x',
                }).isAsync
            ).toBe(true);
        });
    });

    describe('isDefer', () => {
        it('defer=true and valid src means Defer', async () => {
            expect(
                new ScriptNode({
                    defer: true,
                    src: 'a.js',
                }).isDefer
            ).toBe(true);
        });

        it('defer=true but no src means no Defer', async () => {
            expect(
                new ScriptNode({
                    defer: true,
                    content: ';',
                }).isDefer
            ).toBe(false);
        });

        it('ESM means Defer', async () => {
            expect(
                new ScriptNode({
                    type: 'module',
                }).isDefer
            ).toBe(true);
        });
    });

    describe('clone', () => {
        it('clone by default', async () => {
            const script = new ScriptNode({
                src: 'a.js',
            });

            expect(script).toEqual(script.clone());
        });

        it('clone with override', async () => {
            const script = new ScriptNode({
                src: 'a.js',
            });

            expect(
                script.clone({
                    src: 'b.js',
                }).src
            ).toBe('b.js');
        });
    });
});
