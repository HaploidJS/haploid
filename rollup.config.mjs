import { fileURLToPath } from 'url';
import path from 'path';

import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import eslint from '@rollup/plugin-eslint';
import terser from '@rollup/plugin-terser';

import copy from 'rollup-plugin-copy';
import typescript from 'rollup-plugin-typescript2';
import analyzer from 'rollup-plugin-analyzer';
import json from './scripts/rollup-plugin-json.mjs';

import packageJson from './package.json' assert { type: 'json' };

const extensions = ['.js', '.ts'];

const timeStr = new Date().toISOString();

const $__filename = fileURLToPath(import.meta.url);
const $__dirname = path.dirname($__filename);

function generateBanner(filename) {
    return `/** @license ${packageJson.name.split('/').pop()} v${packageJson.version}
* ${filename}
*
* Copyright (c) Kuaishou
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*
* Date: ${timeStr}
*/`;
}

const builds = {
    // CommonJS
    cjs: { file: 'dist/haploid.cjs.dev.js', format: 'cjs' },
    'cjs-min': { file: 'dist/haploid.cjs.min.js', format: 'cjs' },
    // ES
    esm: { file: 'dist/haploid.esm.dev.js', format: 'es' },
    'esm-min': { file: 'dist/haploid.esm.min.js', format: 'es' },
    // System
    system: { file: 'dist/haploid.system.dev.js', format: 'system' },
    'system-min': { file: 'dist/haploid.system.min.js', format: 'system' },
    // UMD
    umd: {
        file: 'dist/haploid.umd.dev.js',
        format: 'umd',
        name: packageJson.name.split('/').pop(),
    },
    'umd-min': {
        file: 'dist/haploid.umd.min.js',
        format: 'umd',
        name: packageJson.name.split('/').pop(),
    },
};

if (process.env.NODE_ENV === 'development' && process.env.BUILD_TARGET) {
    console.log(`💡 Only build ${process.env.BUILD_TARGET} locally.`);
    Object.keys(builds).forEach(key => {
        if (process.env.BUILD_TARGET !== key) {
            Reflect.deleteProperty(builds, key);
        }
    });
}

function getConfig(name) {
    const options = builds[name];

    const config = {
        input: 'src/index.ts',
        output: {
            ...options,
            sourcemap: true,
            banner: generateBanner(options.file.split('/')[1]),
        },
        plugins: [
            resolve({
                browser: true,
                extensions,
            }),
            json({
                // Only version and name are required.
                keys: ['version', 'name'],
                include: RegExp(path.join($__dirname, 'package.json')),
            }),
            eslint({
                overrideConfigFile: path.join($__dirname, '.eslintrc.js'),
                ignorePath: path.join($__dirname, '.eslintignore'),
                exclude: ['**/*.js'],
                throwOnError: true,
            }),
            typescript({
                useTsconfigDeclarationDir: true,
                tsconfig: path.join($__dirname, 'tsconfig.build.json'),
            }),
            babel({
                exclude: /node_modules/,
                extensions,
                babelHelpers: 'runtime',
                configFile: path.join($__dirname, 'babel.config.js'),
            }),
            commonjs({
                include: /node_modules/,
            }),
            analyzer({
                summaryOnly: true,
                limit: 10,
            }),
            copy({
                flatten: false,
                targets: [
                    {
                        src: 'src/**/*.d.ts',
                        dest: 'types/src',
                    },
                ],
            }),
            name.endsWith('-min') &&
                terser({
                    ecma: 6,
                    compress: {
                        passes: 2,
                    },
                    output: {
                        comments: function (node, comment) {
                            const text = comment.value;
                            const type = comment.type;
                            if (type === 'comment2') {
                                return /@preserve|@license|@vite-ignore|webpackIgnore/i.test(text);
                            }

                            return false;
                        },
                    },
                }),
        ],
    };

    return config;
}

export default Object.keys(builds).map(getConfig);
