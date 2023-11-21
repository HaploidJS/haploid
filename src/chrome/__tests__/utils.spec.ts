import { analyse, urlRewrite, createFetchResourceOptions } from '../utils';
import { ScriptNode, StyleNode } from '../../node/';

describe('analyse', () => {
    it('filter invalid script', () => {
        const { depScripts } = analyse({
            scripts: [
                new ScriptNode({
                    content: ';',
                }),
                new ScriptNode({
                    content: ';',
                }),
                new ScriptNode({
                    content: '',
                }),
            ],
            styles: [],
        });

        expect(depScripts).toHaveLength(1);
    });

    it('throws if more than entries', () => {
        expect(() =>
            analyse({
                scripts: [
                    new ScriptNode({
                        content: ';',
                        entry: true,
                    }),
                    new ScriptNode({
                        content: ';',
                        entry: true,
                    }),
                ],
                styles: [],
            })
        ).toThrow(/Unexpected redundant entries/i);
    });

    it('last script is entry by default', () => {
        const { entry } = analyse({
            scripts: [
                new ScriptNode({
                    content: '3;',
                }),
                new ScriptNode({
                    content: '4;',
                }),
            ],
            styles: [],
        });

        expect(entry?.content).toBe('4;');
    });

    it('entry is null if not found', () => {
        expect(
            analyse({
                scripts: [
                    new ScriptNode({
                        content: ';',
                        entry: false,
                    }),
                    new ScriptNode({
                        content: ';',
                        entry: false,
                    }),
                ],
                styles: [],
            })
        ).toMatchObject({ entry: null });
    });

    it('filter invalid style', () => {
        const { styles } = analyse({
            scripts: [
                new ScriptNode({
                    content: ';',
                }),
            ],
            styles: [
                new StyleNode({
                    content: 'div{}',
                }),
                new StyleNode({}),
            ],
        });

        expect(styles).toHaveLength(1);
    });

    it('scripts before entry and is not async or defer could be dependencies of async entry', () => {
        const { depScripts, nonDepScripts } = analyse({
            scripts: [
                new ScriptNode({
                    src: '/a.js',
                    defer: true,
                }),
                new ScriptNode({
                    content: '1;',
                    async: true,
                }),
                new ScriptNode({
                    content: '2;',
                }),
                new ScriptNode({
                    content: '3;',
                    async: true,
                    entry: true,
                }),
                new ScriptNode({
                    content: '4;',
                }),
                new ScriptNode({
                    content: '5;',
                    async: true,
                }),
                new ScriptNode({
                    src: '/b.js',
                    defer: true,
                }),
            ],
            styles: [],
        });

        expect(depScripts).toHaveLength(1);
        expect(depScripts[0].content).toBe('2;');
        expect(nonDepScripts).toHaveLength(5);
    });

    it('scripts before entry and is not async or other scripts not async or defer could be dependencies of defer entry', () => {
        const { depScripts, nonDepScripts } = analyse({
            scripts: [
                new ScriptNode({
                    src: '/a.js',
                    defer: true,
                }),
                new ScriptNode({
                    content: '1;',
                    async: true,
                }),
                new ScriptNode({
                    content: '2;',
                }),
                new ScriptNode({
                    src: '/entry.js',
                    defer: true,
                    entry: true,
                }),
                new ScriptNode({
                    content: '4;',
                }),
                new ScriptNode({
                    content: '5;',
                    async: true,
                }),
                new ScriptNode({
                    src: '/b.js',
                    defer: true,
                }),
            ],
            styles: [],
        });

        expect(depScripts).toHaveLength(3);
        expect(depScripts[0].src).toContain('/a.js');
        expect(depScripts[1].content).toBe('2;');
        expect(depScripts[2].content).toBe('4;');
        expect(nonDepScripts).toHaveLength(3);
    });

    it('scripts before entry and is not async or defer could be dependencies of normal entry', () => {
        const { depScripts, nonDepScripts } = analyse({
            scripts: [
                new ScriptNode({
                    src: '/a.js',
                    defer: true,
                }),
                new ScriptNode({
                    content: '1;',
                    async: true,
                }),
                new ScriptNode({
                    content: '2;',
                }),
                new ScriptNode({
                    src: '/entry.js',
                    entry: true,
                }),
                new ScriptNode({
                    content: '4;',
                }),
                new ScriptNode({
                    content: '5;',
                    async: true,
                }),
                new ScriptNode({
                    src: '/b.js',
                    defer: true,
                }),
            ],
            styles: [],
        });

        expect(depScripts).toHaveLength(1);
        expect(depScripts[0].content).toBe('2;');
        expect(nonDepScripts).toHaveLength(5);
    });
});

describe('urlRewrite', () => {
    it('urlRewrite is nullish', () => {
        const { scripts, styles } = urlRewrite({
            scripts: [
                new ScriptNode({
                    src: 'a.js',
                }),
            ],
            styles: [
                new StyleNode({
                    href: 'a.css',
                }),
            ],
        });

        expect(scripts).toHaveLength(1);
        expect(styles).toHaveLength(1);
        expect(scripts[0].src).toBe('a.js');
        expect(styles[0].href).toBe('a.css');
    });

    it('urlRewrite is not function', () => {
        const { scripts, styles } = urlRewrite(
            {
                scripts: [
                    new ScriptNode({
                        src: 'a.js',
                    }),
                ],
                styles: [
                    new StyleNode({
                        href: 'a.css',
                    }),
                ],
            },
            // @ts-ignore test
            2
        );

        expect(scripts).toHaveLength(1);
        expect(styles).toHaveLength(1);
        expect(scripts[0].src).toBe('a.js');
        expect(styles[0].href).toBe('a.css');
    });

    it('urlRewrite returns not string', () => {
        const { scripts, styles } = urlRewrite(
            {
                scripts: [
                    new ScriptNode({
                        src: 'a.js',
                    }),
                ],
                styles: [
                    new StyleNode({
                        href: 'a.css',
                    }),
                ],
            },
            // @ts-ignore test
            () => 4
        );

        expect(scripts).toHaveLength(1);
        expect(styles).toHaveLength(1);
        expect(scripts[0].src).toBe('a.js');
        expect(styles[0].href).toBe('a.css');
    });

    it('urlRewrite returns right', () => {
        const rewriteFn = jest.fn((src: string) => {
            return new URL(src, location.href).href;
        });

        const { scripts, styles } = urlRewrite(
            {
                scripts: [
                    new ScriptNode({
                        src: 'a.js',
                    }),
                ],
                styles: [
                    new StyleNode({
                        href: 'a.css',
                    }),
                ],
            },
            rewriteFn
        );

        expect(scripts).toHaveLength(1);
        expect(styles).toHaveLength(1);

        expect(rewriteFn).toHaveBeenNthCalledWith(1, 'a.js');
        expect(rewriteFn).toHaveBeenNthCalledWith(2, 'a.css');

        expect(scripts[0].src).toBe('http://localhost/test/a.js');
        expect(styles[0].href).toBe('http://localhost/test/a.css');
    });
});

describe('createFetchResourceOptions', () => {
    it('fetchResourceOptions in function type', async () => {
        const rfo = createFetchResourceOptions('a.js', () => ({ timeout: 3 }));
        expect(rfo).toMatchObject({ timeout: 3 });
    });

    it('timeout is 5000 by default', async () => {
        const rfo = createFetchResourceOptions('a.js');
        expect(rfo).toMatchObject({ timeout: 5000 });
    });

    it('retries is 0 by default', async () => {
        const rfo = createFetchResourceOptions('a.js');
        expect(rfo).toMatchObject({ retries: 0 });
    });

    it('retries is 0 if illegal', async () => {
        // @ts-ignore test
        let rfo = createFetchResourceOptions('a.js', { retries: 'x' });
        expect(rfo).toMatchObject({ retries: 0 });
        // @ts-ignore test
        rfo = createFetchResourceOptions('a.js', { retries: -5 });
        expect(rfo).toMatchObject({ retries: 0 });
    });
});
