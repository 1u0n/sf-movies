var path = require('path');

module.exports = {
    context: path.resolve(__dirname, "src/js"),
    entry: './main.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        libraryTarget: 'var',
        library: 'sf_movies'
    }
};