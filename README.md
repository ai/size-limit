# Size Limit

Show package size and return error if it is bigger than limits allow.

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

Add few bytes to current size to get a limit.
Add `npm run` script to `package.json`:

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
