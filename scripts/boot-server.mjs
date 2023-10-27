import http from 'http';
import path from 'path';
import url from 'url';

import handler from 'serve-handler';
import killport from 'kill-port';

import { servers, ports } from './ports.mjs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function createServer(base, port) {
    const server = http.createServer(async (request, response) => {
        const url = new URL(request.url, `http://${request.headers.host}`);

        let publicPath = base;
        if (/haploid.(cjs|esm|system|umd).(min|dev).js(.map)?$/.test(url.pathname)) {
            publicPath = path.join(__dirname, '..', 'dist');
        }

        await handler(request, response, {
            public: publicPath,
            etag: true,
            headers: [
                {
                    source: '**/*',
                    headers: [
                        {
                            key: 'Cache-Control',
                            value: 'no-store',
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

export const serverBooting = Promise.all(
    servers.map(name =>
        killport(ports[name])
            .catch(() => {})
            .then(() => createServer(path.join(__dirname, '..', 'e2e', name), ports[name]))
    )
);
