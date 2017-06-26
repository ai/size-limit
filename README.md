# Size Limit

Show how many kilobytes your JS library will add to a user bundle.

You can add this tool to Travis CI and set the limit. If you accidentally
add a very big dependency, Size Limit will throw an error.

<p align="center">
  <img src="./example.png" alt="Size Limit example" width="654" height="450">
</p>

<a href="https://evilmartians.com/?utm_source=size-limit">
  <img src="https://evilmartians.com/badges/sponsored-by-evil-martians.svg"
       alt="Sponsored by Evil Martians" width="236" height="54">
</a>

## Usage

Install `size-limit`:

```sh
$ npm install --save-dev size-limit
```

Get current project size:

```sh
$ ./node_modules/bin/size-limit

  Package size: 8.46 KB
  With all dependencies, minifier and gzipped

```

If project size looks to big run
[Webpack Bundle Analyzer](https://github.com/th0r/webpack-bundle-analyzer):

```sh
./node_modules/bin/size-limit --why
```

Add some bytes to current size to get the limit
by adding `npm run` script to `package.json`:

```diff json
  "scripts": {
    "test": "jest && eslint .",
+    "size": "size-limit 9KB"
  }
```

Add `size` script to tests:

```diff js
  "scripts": {
-    "test": "jest && eslint .",
+    "test": "jest && eslint . && npm run size",
    "size": "size-limit 9KB"
  }
```

Don’t forget to add [Travis CI](https://github.com/dwyl/learn-travis)
to your project.

## JS API

```js
const getSize = require('size-limit')

const index = path.join(__dirname, 'index.js')
const extra = path.join(__dirname, 'extra.js')

getSize([index, extra]).then(size => {
  if (size > 1 * 1024 * 1024) {
    console.error('Project become bigger than 1MB')
  }
})
```
