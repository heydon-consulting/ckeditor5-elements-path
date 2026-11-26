# ckeditor5-elements-path

CKEditor 4's Elements Path for Drupal's CKEditor 5: a bar under the editing
area listing the elements around the cursor, outermost first (`ul › li › em`).
Clicking one selects it.

- An inline element (`strong`, `a`) selects its text, a block (`p`, `ul`,
  `blockquote`) its contents, and a widget (a table or image) itself.
- Hovering an element shows its classes, like `mark.demo-marker`.
- The path is CKEditor's editing view, so what will be saved: CKEditor 5 saves
  `<strong>bold <a>link</a></strong>` as
  `<strong>bold </strong><a><strong>link</strong></a>`, so the link's path is
  `p › a › strong`. Markup that only exists while editing is left out.
- The bar is always shown, in every CKEditor 5 text format, except while
  editing the source.

This is the library. In Drupal it's used through the `ckeditor5_elements_path`
module, which loads it from `/libraries/ckeditor5-elements-path/`.

## Installing in Drupal

Put the package in the site's `libraries/ckeditor5-elements-path/`, then
enable the module. The bar then shows in every CKEditor 5 text format.

With Composer and [asset-packagist](https://asset-packagist.org):

```sh
composer require npm-asset/ckeditor5-elements-path
```

Or download a release and extract it to `libraries/ckeditor5-elements-path/`,
so that `libraries/ckeditor5-elements-path/build/elementsPath.js` exists.

## What's in the package

| Path | |
|---|---|
| `build/elementsPath.js` | The plugin, built for Drupal: registered as `CKEditor5.elementsPath`, with `ckeditor5/src/*` from the CKEditor 5 DLL that Drupal core loads. It starts with a docblock giving the package name and version. |
| `css/elements-path.css` | The bar's styles, plain CSS using CKEditor's custom properties. |
| `src/` | The source. |

The build uses Drupal's CKEditor 5 DLL, so it runs in Drupal, not in a
standalone CKEditor 5 app.

## Translations

The labels ("Elements path", "Select %0") use CKEditor's own translation,
`editor.t()`, so they come from CKEditor's dictionaries
(`window.CKEDITOR_TRANSLATIONS`), not Drupal's interface translation. Without
a dictionary for the editor's language they're in English.

## Development

```sh
npm install
npm run build    # or: npm run watch
```

The `ckeditor5` dev dependency should match the CKEditor 5 version Drupal core
ships (`core/core.libraries.yml`, library `ckeditor5`), so the DLL lookups
match. Rebuild when Drupal moves to a new major version of CKEditor 5.

## Releasing

The compiled `build/` is committed: GitHub's release downloads come from the
repository, not npm. A release keeps it in step with the source:

```sh
npm version patch          # or minor / major: rebuilds, commits build/, tags v<version>
npm publish --otp=<code>   # rebuilds and checks first
git push --follow-tags
```

`npm publish` (its `prepublishOnly` script) rebuilds and refuses to publish
unless the build matches what's committed, nothing is uncommitted, and the
commit is tagged `v<version>`. On GitHub, the Build workflow fails when the
committed `build/` doesn't match the source.

The npm package also has `webpack.config.js`, so it can be rebuilt from `src/`
against another CKEditor 5 version (`npm install ckeditor5@<version>` next to
it, then `npx webpack`).

## License

MIT
