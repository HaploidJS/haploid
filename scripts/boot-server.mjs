import http from 'http';
import path from 'path';
import url from 'url';
import mime from 'mime';

import handler from 'serve-handler';
import killport from 'kill-port';

import { port } from './ports.mjs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function createServer(base, port) {
    const server = http.createServer(async (request, response) => {
        const url = new URL(request.url, `http://${request.headers.host}`);

        let publicPath = base;
        if (/haploid.(cjs|esm|system|umd).(min|dev).js(.map)?$/.test(url.pathname)) {
            publicPath = path.join(__dirname, '..', 'dist');
            url.pathname = path.basename(url.pathname);
            request.url = url.toString();
        }

        const ext = path.extname(url.pathname).replace(/\./g, '');

        const MIME = mime.getType(ext);

        await handler(request, response, {
            public: publicPath,
            etag: true,
            cleanUrls: false,
            trailingSlash: false,
            headers: [
                {
                    source: '**/*',
                    headers: [
                        {
                            key: 'Cache-Control',
                            value: 'no-store',
                        },
                        {
                            key: 'Content-Type',
                            value: MIME,
                        },
                    ],
                },
            ],
        });
    });

    return new Promise((resolve, reject) => {
        server.listen(port, () => {
            console.log(`Serving ${base} at http://localhost:${port}`);
            resolve(server);
        });

        server.on('error', reject);
    });
}

export const serverBooting = killport(port)
    .catch(() => {})
    .then(() => createServer(path.join(__dirname, '..', 'e2e'), port));
