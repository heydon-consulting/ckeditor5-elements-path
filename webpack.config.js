/**
 * @file
 * Builds src/index.js to build/elementsPath.js, as Drupal core builds its own
 * CKEditor 5 plugins.
 *
 * `ckeditor5/src/*` imports resolve to the CKEditor 5 DLL that Drupal core
 * loads (CKEditor5.dll), so the build doesn't include CKEditor itself, and the
 * plugin is registered as CKEditor5.elementsPath, where Drupal looks for
 * `elementsPath.ElementsPath`.
 */

const path = require('node:path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => ({
  mode: argv.mode === 'development' ? 'development' : 'production',
  devtool: false,
  optimization: {
    minimize: argv.mode !== 'development',
    minimizer: [
      new TerserPlugin({
        terserOptions: { format: { comments: false } },
        test: /\.js(\?.*)?$/i,
        extractComments: false,
      }),
    ],
    moduleIds: 'named',
  },
  entry: {
    path: path.resolve(__dirname, 'src/index.js'),
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'elementsPath.js',
    library: ['CKEditor5', 'elementsPath'],
    libraryTarget: 'umd',
    libraryExport: 'default',
  },
  plugins: [
    new webpack.DllReferencePlugin({
      manifest: require('ckeditor5/build/ckeditor5-dll.manifest.json'), // eslint-disable-line global-require
      scope: 'ckeditor5/src',
      name: 'CKEditor5.dll',
    }),
  ],
  module: {
    // SVG icons are imported as their markup.
    rules: [{ test: /\.svg$/, type: 'asset/source' }],
  },
});
