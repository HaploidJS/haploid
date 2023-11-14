const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        library: {
            name: 'var-external',
            type: 'umd',
            export: 'default',
        },
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js',
    },
    optimization: {
        minimize: false,
    },
    externalsType: 'var',
    externals: {
        'mark-external': 'markExternal',
    },
};
