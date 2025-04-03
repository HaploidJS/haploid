import url from 'url';
import http from 'http';
import path from 'path';

import handler from 'serve-handler';
import { execa } from 'execa';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const specFiles = process.argv.slice(2);

let singletonTest = false;

if (!specFiles.length) {
    specFiles.push('./src/.*/__tests__/.*.spec.ts');
} else {
    singletonTest = true;
}

const retryCache = new Map();

const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const delay = +url.searchParams.get('delay') || 0;
    const retry = +url.searchParams.get('retry') || 0;
    const content = url.searchParams.get('content');
    let expectHeaders = {};

    try {
        expectHeaders = JSON.parse(url.searchParams.get('headers') ?? '{}');
    } catch {
        // ignore
    }

    if (delay) {
        await new Promise(re => setTimeout(re, delay));
    }

    if (retry) {
        let visitTimes = retryCache.get(url.origin + url.pathname);
        if (!visitTimes) {
            visitTimes = 0;
        }
        visitTimes++;
        retryCache.set(url.origin + url.pathname, visitTimes);

        if (visitTimes <= retry) {
            response.writeHead(500, content || `Visit Times ${visitTimes} Less Than ${retry}`, {
                'Access-Control-Allow-Origin': '*',
                ...expectHeaders,
            });
            response.end();
            return;
        }
    }

    if (content) {
        response.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            ...expectHeaders,
        });
        response.end(content);
        return;
    }

    const presetHeaders = [
        {
            key: 'Access-Control-Allow-Origin',
            value: '*',
        },
    ];

    for (const key in expectHeaders) {
        presetHeaders.push({
            key,
            value: expectHeaders[key],
        });
    }

    await handler(request, response, {
        public: path.join(__dirname, '..', 'mocks'),
        cleanUrls: false,
        headers: [
            {
                // ⚠️ All extensions must have CORS headers
                source: '**/*.@(js|css|json|htm|html|shtml|xhtml|txt)',
                headers: presetHeaders,
            },
            {
                source: '**/*.@(js)',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'text/javascript;charset:utf-8',
                    },
                ],
            },
            {
                source: '**/*.@(css)',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'text/css;charset:utf-8',
                    },
                ],
            },
            {
                source: '**/*.@(json)',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/json;charset:utf-8',
                    },
                ],
            },
            {
                source: '**/*.@(htm|html|shtml|xhtml)',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'text/html;charset=utf-8',
                    },
                ],
            },
            {
                source: '**/*.@(txt)',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'text/plain',
                    },
                ],
            },
        ],
    });
});

server.listen(10810, () => {
    console.log('Running at http://localhost:10810');

    const pro = execa(
        'npx',
        ['jest', '-i', singletonTest ? '' : '--collectCoverage', '--bail', '--verbose', ...specFiles].filter(Boolean),
        {
            stdio: 'inherit',
        }
    );

    pro.on('exit', code => {
        server.close();

        if (code) {
            process.exit(code);
        }
    });
});
