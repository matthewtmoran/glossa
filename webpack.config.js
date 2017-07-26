const webpack = require('webpack');
const cleanPlugin = require('clean-webpack-plugin');
const copyPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const path = require('path');

const frontEndRoot = `${__dirname}/src`;
const backEndRoot = `${__dirname}/server`;
const dist = `${__dirname}/dist`;

const paths = {
  common: {},
  frontEnd: {
    app: `${frontEndRoot}/app/root.module.js`,
    output: `${dist}/`,
    styles: `${frontEndRoot}/styles`,
    static: {
      index: `${frontEndRoot}/index.html`,
      manifest: `${frontEndRoot}/manifest.json`,
      images: `${frontEndRoot}/img/**/*`
    }
  },
  backEnd: {
    app: `${backEndRoot}/app.js`,
    output: `${dist}/backEnd`,
  },
};



// Plugins
const prep = {
  clean: new cleanPlugin([
    dist
  ]),
  copy: new copyPlugin([
    {
      from: paths.frontEnd.static.index,
      to: `${paths.frontEnd.output}`,
    },
    {
      from: paths.frontEnd.static.images,
      to: `${paths.frontEnd.output}/img/`,
      flatten: true
    }
  ]),
  jquery: new webpack.ProvidePlugin({
    $: 'jquery',
    jQuery: 'jquery',
    'window.jQuery': 'jquery'
  })
};


const extract = {
  styles: new ExtractTextPlugin('css/styles.css')
};

// Loaders
const frontEndScripts = {
  test: /\.js$/,
  use: [
    'ng-annotate-loader',
    'babel-loader',
  ],
  exclude: [
    path.resolve(__dirname, "node_modules"),
    path.resolve(__dirname, "src/server")
  ],
};

const backEndScripts = {
  test: /\.js$/,
  use: [
    'babel-loader',
  ],
  exclude: path.resolve(__dirname, "node_modules"),
};

const styles = {
  test: /\.scss$/,
  use:
    ExtractTextPlugin.extract({
      fallback: "style-loader",
      use: [
        {loader: 'css-loader', options: {sourceMap: true}},
        {loader: 'sass-loader', options: {
          sourceMap: true,
          includePaths: [paths.frontEnd.styles]
        }}
      ]
    }),
};

const markup = {
  test: /\.html$/,
  use: [
    {loader: 'ngtemplate-loader'},
    {loader: 'html-loader'}
  ]
};

const fonts = {
  test: /\.(eot|svg|ttf|woff|woff2)$/,

  use: [{
    loader: 'file-loader',
    options: {
      name: 'fonts/[name].[ext]',
    }
  }]
};

const common = {
  resolve: {
    alias: {
      'wavesurferDev': path.resolve(__dirname, 'node_modules/wavesurfer.js/dist/wavesurfer.js'),
      'ngCodemirror': path.resolve(__dirname, 'node_modules/angular-ui-codemirror/src/ui-codemirror.js'),
      'socket.io-client': path.resolve(__dirname, 'node_modules/socket.io-client/dist/socket.io.js')
    },
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  devtool: 'source-map',
  plugins: [
    prep.clean,
    prep.copy,
  ],
};

const frontEnd = {
  entry: [
    paths.frontEnd.app
  ],
  output: {
    path: paths.frontEnd.output,
    filename: 'app.bundle.js',
    publicPath: "http://localhost:9000/", // Development Server
  },
  module: {
    rules: [
      frontEndScripts,
      styles,
      markup,
      fonts,
      {
        test: /\.json$/,
        use: 'json-loader'
      }
    ],
  },
  plugins: [
    prep.clean,
    prep.copy,
    prep.jquery,
    extract.styles,
  ],
};

const backEnd = {
  target: 'node',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  entry: [
    paths.backEnd.app
  ],
  output: {
    path: paths.backEnd.output,
    filename: 'server.bundle.js',
  },
  module: {
    rules: [
      backEndScripts,
      { test: /\.json$/, use: 'json-loader' },
    ]
  }
};


module.exports = Object.assign({}, common, frontEnd);
