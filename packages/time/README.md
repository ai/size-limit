# Size Limit Time Plugin

The plugin for [Size Limit] to track JS download and execution time by [estimo]
and Puppeter.

## Customize Network Speed

By default, Size Limit measures the loading time of your files using a slow 3G
network (50 kB/s) without latency. You can customize these settings for each
check by modifying your Size Limit configuration:

1. Install the preset:

```sh
npm install --save-dev size-limit @size-limit/file @size-limit/time
```

2. Add the size-limit [config](https://github.com/ai/size-limit?tab=readme-ov-file#limits-config):

```js
// .size-limit.js
export default [
  {
    path: 'index.js',
    time: {
      networkSpeed: '5 MB', // Custom network speed for loading files
      latency: '800 ms', // Custom network latency
      loadingMessage: 'on fast 4G' // Custom message in output
    }
  }
]
```

3. After configuring, run Size Limit to check the customized loading time:

```sh
    $ npm run size-limit

      Package size: 998.6 kB
      Loading time: 200 ms   on fast 4G
      Running time: 214 ms   on Snapdragon 410
      Total time:   1.3 s
```

See [Size Limit] docs for more details.

[Size Limit]: https://github.com/ai/size-limit/
[estimo]: https://github.com/mbalabash/estimo

<a href="https://evilmartians.com/?utm_source=size-limit">
  <img src="https://evilmartians.com/badges/sponsored-by-evil-martians.svg"
       alt="Sponsored by Evil Martians" width="236" height="54">
</a>
