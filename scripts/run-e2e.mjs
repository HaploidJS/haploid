import { execa } from 'execa';

import { serverBooting } from './boot-server.mjs';

serverBooting.then(servers => {
    const pro = execa('npx', ['cypress', 'run'], {
        stdio: 'inherit',
    });

    pro.on('exit', code => {
        servers.forEach(server => server.close());

        if (code) {
            process.exit(code);
        }
    });
});
