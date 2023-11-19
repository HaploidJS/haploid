import { resolveAssetsFromEntry } from '@/utils/resolveAssetsFromEntry';

describe('resolveAssetsFromEntry by ways', () => {
    it('resolved a non-ESM entry by extension=.js', async () => {
        const { isJS, styles, scripts } = await resolveAssetsFromEntry({
            url: '/a.js',
        });

        expect(isJS).toBe(true);
        expect(styles).toHaveLength(0);
        expect(scripts).toHaveLength(1);
        expect(scripts[0].isESM).toBe(false);
        expect(scripts[0].src).toBe(`${location.origin}/a.js`);
    });

    it('resolved a ESM entry by extension=.mjs', async () => {
        const { scripts } = await resolveAssetsFromEntry({
            url: '/a.mjs',
        });

        expect(scripts).toHaveLength(1);
        expect(scripts[0].isESM).toBe(true);
        expect(scripts[0].src).toBe(`${location.origin}/a.mjs`);
    });

    it('resolved a JS entry by content-type', async () => {
        for (const contentType of ['text/javascript', 'application/javascript', 'application/ecmascript']) {
            const entryUrl = `//localhost:10810/resolveAssetsFromEntry/fake-entry?headers=${encodeURIComponent(
                JSON.stringify({
                    'Content-Type': `${contentType};charset=utf-8`,
                })
            )}&content=${encodeURIComponent(`;`)}`;

            const urlObj = new URL(entryUrl, location.href);

            const { isJS, scripts, styles } = await resolveAssetsFromEntry({
                url: entryUrl,
            });
            expect(isJS).toBe(true);
            expect(styles).toHaveLength(0);
            expect(scripts).toHaveLength(1);
            // Relative to entry url, not host url
            expect(scripts[0].src).toBe(urlObj.href);
        }
    });

    it('resolved a JSON entry(version1) by extension=.json', async () => {
        const { isJSON, scripts, styles } = await resolveAssetsFromEntry({
            url: '//localhost:10810/resolveAssetsFromEntry/entry-version1.json',
        });
        expect(isJSON).toBe(true);
        expect(styles).toHaveLength(1);
        expect(scripts).toHaveLength(1);
        expect(styles[0].href).toBe(`http://localhost:10810/resolveAssetsFromEntry/initial.css`);
        expect(scripts[0].src).toBe(`http://localhost:10810/resolveAssetsFromEntry/initial.js`);
    });

    it('resolved a JSON entry(version2) by extension=.json', async () => {
        const { isJSON, scripts, styles } = await resolveAssetsFromEntry({
            url: '//localhost:10810/resolveAssetsFromEntry/entry-version2.json',
        });
        expect(isJSON).toBe(true);
        expect(styles).toHaveLength(1);
        expect(scripts).toHaveLength(1);
        expect(styles[0].href).toBe(`http://localhost:10810/resolveAssetsFromEntry/initial.css`);
        expect(scripts[0].isESM).toBe(true);
        expect(scripts[0].src).toBe(`http://localhost:10810/resolveAssetsFromEntry/initial.js`);
    });

    it('resolved a JSON entry by content-type=application/json', async () => {
        const entryUrl = `//localhost:10810/resolveAssetsFromEntry/fake-entry?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': 'application/json;charset=utf-8',
            })
        )}&content=${encodeURIComponent(
            JSON.stringify({
                version: 2,
                module: 'esm',
                css: ['initial.css'],
                js: ['initial.js'],
            })
        )}`;

        const urlObj = new URL(entryUrl, location.href);

        const { isJSON, scripts, styles } = await resolveAssetsFromEntry({
            url: entryUrl,
        });
        expect(isJSON).toBe(true);
        expect(styles).toHaveLength(1);
        expect(scripts).toHaveLength(1);
        // Relative to entry url, not host url
        expect(styles[0].href).toBe(`${urlObj.origin}/resolveAssetsFromEntry/initial.css`);
        expect(scripts[0].isESM).toBe(true);
        expect(scripts[0].src).toBe(`${urlObj.origin}/resolveAssetsFromEntry/initial.js`);
    });

    it('resolved a HTML entry by content-type=text/html', async () => {
        const entryUrl = `//localhost:10810/resolveAssetsFromEntry/fake-entry?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': 'text/html;charset=utf-8',
            })
        )}&content=${encodeURIComponent(
            `<!DOCTYPE html>
<html lang="zh-CN">
    <head>
        <link rel="stylesheet" href="a.css">
    </head>
    <body>
    <script src="a.js"></script>
    </body>
</html>`
        )}`;

        const urlObj = new URL(entryUrl, location.href);

        const { isHTML, scripts, styles } = await resolveAssetsFromEntry({
            url: entryUrl,
        });
        expect(isHTML).toBe(true);
        expect(styles).toHaveLength(1);
        expect(scripts).toHaveLength(1);
        // Relative to entry url, not host url
        expect(styles[0].href).toBe(`${urlObj.origin}/resolveAssetsFromEntry/a.css`);
        expect(scripts[0].src).toBe(`${urlObj.origin}/resolveAssetsFromEntry/a.js`);
    });

    it('resolved a HTML entry by content-type=application/xhtml+xml', async () => {
        const entryUrl = `//localhost:10810/resolveAssetsFromEntry/fake-entry?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': 'application/xhtml+xml;charset=utf-8',
            })
        )}&content=${encodeURIComponent(
            `<!DOCTYPE html>
<html lang="zh-CN">
    <head>
        <link rel="stylesheet" href="a.css">
    </head>
    <body>
    <script src="a.js"></script>
    </body>
</html>`
        )}`;

        const urlObj = new URL(entryUrl, location.href);

        const { isHTML, scripts, styles } = await resolveAssetsFromEntry({
            url: entryUrl,
        });
        expect(isHTML).toBe(true);
        expect(styles).toHaveLength(1);
        expect(scripts).toHaveLength(1);
        // Relative to entry url, not host url
        expect(styles[0].href).toBe(`${urlObj.origin}/resolveAssetsFromEntry/a.css`);
        expect(scripts[0].src).toBe(`${urlObj.origin}/resolveAssetsFromEntry/a.js`);
    });

    it('resolved a HTML entry by extension=.(htm|[sx]?html)$', async () => {
        for (const ext of ['.htm', '.html', '.shtml', '.xhtml']) {
            const entryUrl = `//localhost:10810/resolveAssetsFromEntry/entry${ext}`;

            const urlObj = new URL(entryUrl, location.href);

            const { isHTML, scripts, styles } = await resolveAssetsFromEntry({
                url: entryUrl,
            });
            expect(isHTML).toBe(true);
            expect(styles).toHaveLength(1);
            expect(scripts).toHaveLength(1);
            // Relative to entry url, not host url
            expect(styles[0].href).toBe(`${urlObj.origin}/resolveAssetsFromEntry/a.css`);
            expect(scripts[0].src).toBe(`${urlObj.origin}/resolveAssetsFromEntry/a.js`);
        }
    });
});
describe('Detect ESM', () => {
    it('non-ESM detected', async () => {
        const entryUrl = `//localhost:10810/resolveAssetsFromEntry/fake-entry?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': `text/javascript;charset=utf-8`,
            })
        )}&content=${encodeURIComponent(`;function foo(){}`)}`;

        const { scripts } = await resolveAssetsFromEntry({
            url: entryUrl,
        });
        expect(scripts).toHaveLength(1);
        expect(scripts[0].isESM).toBe(false);
    });

    it('ESM detected', async () => {
        const entryUrl = `//localhost:10810/resolveAssetsFromEntry/fake-entry?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': `text/javascript;charset=utf-8`,
            })
        )}&content=${encodeURIComponent(`export const a = 3;`)}`;

        const { scripts } = await resolveAssetsFromEntry({
            url: entryUrl,
        });
        expect(scripts).toHaveLength(1);
        expect(scripts[0].isESM).toBe(true);
    });
});

describe('LastModified', () => {
    it('parse LastModified', async () => {
        const lm = 'Wed, 18 Jan 2023 08:13:06 GMT';
        const entryUrl = `//localhost:10810/resolveAssetsFromEntry/fake-entry?headers=${encodeURIComponent(
            JSON.stringify({
                'last-modified': `${lm}`,
                'Content-Type': 'text/html;charset=utf-8',
            })
        )}&content=${encodeURIComponent(
            `<!DOCTYPE html>
<html lang="zh-CN">
    <head>
        <link rel="stylesheet" href="a.css">
        <style>div{}</style>
        <link rel="stylesheet" href="/b.css">
    </head>
    <body>
    <script src="a.js"></script>
    <script>3;</script>
    <script src="/b.js"></script>
    </body>
</html>`
        )}`;

        const { lastModified } = await resolveAssetsFromEntry({
            url: entryUrl,
        });

        expect(lastModified).toBe(lm);
    });
});

describe('HTML Parser', () => {
    it('parse <link>/<style>/<script>', async () => {
        const entryUrl = `//localhost:10810/resolveAssetsFromEntry/fake-entry?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': 'text/html;charset=utf-8',
            })
        )}&content=${encodeURIComponent(
            `<!DOCTYPE html>
<html lang="zh-CN">
    <head>
        <link rel="stylesheet" href="a.css">
        <style>div{}</style>
        <link rel="stylesheet" href="/b.css">
    </head>
    <body>
    <script src="a.js"></script>
    <script>3;</script>
    <script src="/b.js"></script>
    </body>
</html>`
        )}`;

        const urlObj = new URL(entryUrl, location.href);

        const { scripts, styles } = await resolveAssetsFromEntry({
            url: entryUrl,
        });

        expect(styles).toHaveLength(3);
        expect(scripts).toHaveLength(3);

        expect(styles[0].href).toBe(`${urlObj.origin}/resolveAssetsFromEntry/a.css`);
        expect(styles[1].content).toBe(`div{}`);
        expect(styles[2].href).toBe(`${urlObj.origin}/b.css`);

        expect(scripts[0].src).toBe(`${urlObj.origin}/resolveAssetsFromEntry/a.js`);
        expect(scripts[1].content).toBe(`3;`);
        expect(scripts[2].src).toBe(`${urlObj.origin}/b.js`);
    });

    it('resolve headHTML/bodyHTML/title', async () => {
        const entryUrl = `//localhost:10810/resolveAssetsFromEntry/fake-entry?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': 'text/html;charset=utf-8',
            })
        )}&content=${encodeURIComponent(
            `<!DOCTYPE html>
<html lang="zh-CN">
    <head>
        <link rel="stylesheet" href="a.css"><title>FOO</title>
    </head>
    <body>
        <!----><center></center><hr/>FOO
    </body>
</html>`
        )}`;

        const { title, bodyHTML, headHTML } = await resolveAssetsFromEntry({
            url: entryUrl,
        });

        expect(title).toBe('FOO');
        expect(headHTML?.trim()).toBe('<link rel="stylesheet" href="a.css"><title>FOO</title>');
        expect(bodyHTML?.trim()).toBe('<!----><center></center><hr>FOO');
    });

    it('parse async/defer/type/entry/crossorigin/nomodule', async () => {
        const entryUrl = `//localhost:10810/resolveAssetsFromEntry/fake-entry?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': 'text/html;charset=utf-8',
            })
        )}&content=${encodeURIComponent(
            `<!DOCTYPE html>
<html lang="zh-CN">
    <head>
        <link rel="stylesheet" type="text/css" crossorigin="anonymous" href="a.css">
    </head>
    <body>
    <script src="a.js" nomodule async defer type="text/javascript" entry crossorigin="anonymous"></script>
    </body>
</html>`
        )}`;

        const { scripts, styles } = await resolveAssetsFromEntry({
            url: entryUrl,
        });

        expect(styles).toHaveLength(1);
        expect(scripts).toHaveLength(1);

        expect(styles[0].props.rel).toBe(`stylesheet`);
        expect(styles[0].props.type).toBe(`text/css`);
        expect(styles[0].props.crossOrigin).toBe(`anonymous`);

        expect(scripts[0].props.noModule).toBe(true);
        expect(scripts[0].props.async).toBe(true);
        expect(scripts[0].props.defer).toBe(true);
        expect(scripts[0].props.type).toBe(`text/javascript`);
        expect(scripts[0].props.entry).toBe(true);
        expect(scripts[0].props.crossOrigin).toBe(`anonymous`);
    });
});

describe('Option crossOrigin', () => {
    it('parse crossOrigin from html', async () => {
        const entryUrl = `//localhost:10810/resolveAssetsFromEntry/fake-entry?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': 'text/html;charset=utf-8',
            })
        )}&content=${encodeURIComponent(
            `<!DOCTYPE html>
<html lang="zh-CN">
    <head>
        <link rel="stylesheet" crossorigin="anonymous" href="a.css">
    </head>
    <body>
    <script src="a.js" crossorigin="anonymous"></script>
    </body>
</html>`
        )}`;

        const { scripts, styles } = await resolveAssetsFromEntry({
            url: entryUrl,
        });

        expect(styles).toHaveLength(1);
        expect(scripts).toHaveLength(1);

        // props first
        expect(styles[0].crossOrigin).toBe('anonymous');
        expect(scripts[0].crossOrigin).toBe('anonymous');
    });
});
