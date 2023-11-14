import { execa } from 'execa';

import { serverBooting } from './boot-server.mjs';

serverBooting.then(server => {
    const pro = execa('npx', ['cypress', 'run'], {
        stdio: 'inherit',
    });

    pro.on('exit', code => {
        server.close();

        if (code) {
            process.exit(code);
        }
    });
});
