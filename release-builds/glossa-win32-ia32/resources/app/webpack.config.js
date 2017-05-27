const webpack = require('webpack');
const cleanPlugin = require('clean-webpack-plugin');
const copyPlugin = require('copy-webpack-plugin');
const extractPlugin = require('extract-text-webpack-plugin');

// const electron = require('electron');
// const remote = electron.remote;
// const ProvidePlugin = require('ProvidePlugin');

const path = require('path');

const root = `${__dirname}/src`;
const dist = `${__dirname}/dist`;
const paths = {
    app: `${root}/app/root.module.js`,
    styles: `${root}/styles`,
    static: {
        index: `${root}/index.html`,
        manifest: `${root}/manifest.json`,
        images: `${root}/img/**/*`
    }
};

// new webpack.ProvidePlugin({
//   jQuery: "jquery"
// })

const add = {
  jquery: new webpack.ProvidePlugin({
    $: 'jquery',
    jQuery:'jquery',
    'window.jQuery':'jquery'
  })
};


// new webpack.ProvidePlugin({
//   "window.jQuery": "jquery"
// }),

// Plugins
const prep = {
    clean: new cleanPlugin([
        dist
    ]),
    copy: new copyPlugin([{
        from: paths.static.index
    }, {
        from: paths.static.manifest
    }, {
        from: paths.static.images,
        to: 'img/',
        flatten: true
    }])
};


const extract = {
    styles: new extractPlugin('css/styles.css')
};

// Loaders
const scripts = {
    test: /\.js$/,
    exclude: /node_modules/,
    loaders: [
        'ng-annotate',
        'babel',
    ]
};

// const css = {
//     test: /\.css$/,
//     loader: extractPlugin.extract('style', 'css?sourceMap!sass?sourceMap')
// }

const styles = {
    test: /\.scss$/,
    loader: extractPlugin.extract('style', 'css?sourceMap!sass?sourceMap')
};

const markup = {
    test: /\.html$/,
    loader: 'ngtemplate!html'
};

const fonts = {
    test: /\.(eot|svg|ttf|woff|woff2)$/,
    loader: 'file?name=fonts/[name].[ext]'
};

  // resolve: {
    //   alias: {
    //     'wavesurfer': path.resolve(__dirname, './src/lib/wavesurfer.js')
    //   }
    // },
        // 'simplemde-css': path.resolve(__dirname, 'node_modules/simplemde/dist/simplemde.min.css')
// Config object
const config = {
    resolve: {
      alias: {
        'wavesurferDev': path.resolve(__dirname, 'node_modules/wavesurfer.js/dist/wavesurfer.js'),
        'ngCodemirror': path.resolve(__dirname, 'node_modules/angular-ui-codemirror/src/ui-codemirror.js'),
        'socket.io-client': path.resolve(__dirname, 'node_modules/socket.io-client/dist/socket.io.js' )
      },
    },
    entry: {
        bundle: paths.app
    },
    devtool: 'source-map',
    module: {
        loaders: [
            scripts,
            styles,
            markup,
            fonts
        ],
    },
    plugins: [
        prep.clean,
        prep.copy,
        add.jquery,
        extract.styles,
        // new webpack.IgnorePlugin(new RegExp("^(fs|ipc)$"))
    ],
    sassLoader: {
        includePaths: [paths.styles]
    },
    output: {
        path: `${dist}/`,
        publicPath: '/',
        filename: 'js/app.[name].js'
    },
      node: {
        fs: 'empty'
      }
};

module.exports = config;