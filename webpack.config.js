/**
 * @file
 * Builds src/index.js to build/elementsPath.js, as Drupal core builds its own
 * CKEditor 5 plugins.
 *
 * `ckeditor5/src/*` imports resolve to the CKEditor 5 DLL that Drupal core
 * loads (CKEditor5.dll), so the build doesn't include CKEditor itself, and the
 * plugin is registered as CKEditor5.elementsPath, where Drupal looks for
 * `elementsPath.ElementsPath`.
 *
 * The build starts with a docblock naming the package, its version and
 * licence, from package.json, and the copyright line from LICENSE. It's added
 * after minifying so Terser keeps it, and uses `/*!` so later minifiers do too.
 */

const path = require('node:path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const fs = require('node:fs');
const pkg = require('./package.json');

const copyright = fs
  .readFileSync(path.resolve(__dirname, 'LICENSE'), 'utf8')
  .match(/^Copyright .+$/m)[0];

const banner = [
  '/*!',
  ` * ${pkg.name} v${pkg.version}`,
  ` * ${pkg.description}`,
  ' *',
  ` * ${pkg.homepage}`,
  ' *',
  ` * ${copyright}`,
  ` * Licensed under the ${pkg.license} License.`,
  ' */',
].join('\n');

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
    new webpack.BannerPlugin({
      banner,
      raw: true,
      stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
    }),
  ],
  module: {
    // SVG icons are imported as their markup.
    rules: [{ test: /\.svg$/, type: 'asset/source' }],
  },
});
