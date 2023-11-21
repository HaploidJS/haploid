import path from 'path';
import fs from 'fs';
import url from 'url';
import { pathsToModuleNameMapper } from 'ts-jest';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const { compilerOptions } = JSON.parse(
    fs.readFileSync(path.join(__dirname, './tsconfig.common.json'), { encoding: 'utf8' }).toString()
);

/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
const exports = {
    preset: 'ts-jest/presets/js-with-babel',
    testEnvironment: 'jsdom',
    coveragePathIgnorePatterns: ['.js', 'spec'],
    testEnvironmentOptions: {
        url: 'http://localhost/test/',
        runScripts: 'dangerously',
        resources: 'usable',
        html: `<!DOCTYPE html>
        <html lang="en">
            <head></head><body><div id="app"></div></body>
        </html>
        `,
    },
    globals: {
        'ts-jest': {
            babelConfig: path.join(__dirname, 'babel.config.js'),
        },
    },
    moduleNameMapper: {
        'http://localhost:(\\d+)/(.*)': '<rootDir>/mocks/$2',
        ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
    },
    setupFiles: ['<rootDir>/spec/test-setup.ts'],
    testPathIgnorePatterns: [],
};

export default exports;
