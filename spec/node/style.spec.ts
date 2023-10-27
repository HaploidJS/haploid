import { StyleNode } from '@/node/';

describe.only('style', () => {
    describe('isInline', () => {
        it('no href means inline', async () => {
            expect(
                new StyleNode({
                    href: undefined,
                }).isInline
            ).toBe(true);
        });

        it('empty-string href means inline', async () => {
            expect(
                new StyleNode({
                    href: '  ',
                }).isInline
            ).toBe(true);
        });
    });

    describe('disabled', () => {
        it('no disabled is enabled', async () => {
            expect(new StyleNode({}).disabled).toBe(false);
        });

        it('disabled is not enabled', async () => {
            expect(new StyleNode({ disabled: true }).disabled).toBe(true);
        });
    });

    describe('content', () => {
        it('content is trimed', async () => {
            expect(
                new StyleNode({
                    content: '  ',
                }).content
            ).toHaveLength(0);
        });
    });

    describe('isValid', () => {
        it('disabled is not valid', async () => {
            expect(
                new StyleNode({
                    disabled: true,
                    content: 'x',
                }).isValid
            ).toBe(false);
        });
        it('empty-string rel is valid', async () => {
            expect(
                new StyleNode({
                    rel: ' ',
                    content: 'x',
                }).isValid
            ).toBe(true);
        });
        it('stylesheet rel is valid', async () => {
            expect(
                new StyleNode({
                    rel: 'stylesheet ',
                    content: 'x',
                }).isValid
            ).toBe(true);
        });
        it('undefined rel is valid', async () => {
            expect(
                new StyleNode({
                    rel: undefined,
                    content: 'x',
                }).isValid
            ).toBe(true);
        });
        it('other rel is not valid', async () => {
            expect(
                new StyleNode({
                    rel: 'unknown',
                    content: 'x',
                }).isValid
            ).toBe(false);
        });
        it('no href and content is not valid', async () => {
            expect(new StyleNode({}).isValid).toBe(false);
        });
        it('with href but no content is not valid', async () => {
            expect(new StyleNode({ href: 'a.css' }).isValid).toBe(true);
        });
        it('with content but no href is not valid', async () => {
            expect(new StyleNode({ content: 'x' }).isValid).toBe(true);
        });
        it('empty-string type is valid', async () => {
            expect(
                new StyleNode({
                    type: ' ',
                    content: 'x',
                }).isValid
            ).toBe(true);
        });
        it('text/css type is valid', async () => {
            expect(
                new StyleNode({
                    type: 'text/css ',
                    content: 'x',
                }).isValid
            ).toBe(true);
        });
        it('undefined type is valid', async () => {
            expect(
                new StyleNode({
                    type: undefined,
                    content: 'x',
                }).isValid
            ).toBe(true);
        });
    });

    describe('clone', () => {
        it('clone by default', async () => {
            const style = new StyleNode({
                href: 'a.js',
            });

            expect(style).toEqual(style.clone());
        });

        it('clone with override', async () => {
            const style = new StyleNode({
                href: 'a.js',
            });

            expect(
                style.clone({
                    href: 'b.js',
                }).href
            ).toBe('b.js');
        });
    });
});
