# IOpipe Trace Plugin

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Create marks and measures for arbitrary units of time. Measure latency of database calls, third party requests, or code blocks and visualize them in [IOpipe](https://iopipe.com)!

## Requirements
- Node >= `4.3.2`
- NPM >= `2.14.12`
- [IOpipe](https://github.com/iopipe/iopipe-js) >= `1.x`

## Install

__Note: This plugin is automatically included in the recommended package [@iopipe/iopipe](https://github.com/iopipe/iopipe-js)__

With [yarn](https://yarnpkg.com) (recommended) in project directory:

`yarn add @iopipe/trace`

With npm in project directory:

`npm install @iopipe/trace`

Then include the plugin with IOpipe in your serverless function:

```js
const iopipeLib = require('@iopipe/iopipe');
const tracePlugin = require('@iopipe/trace');

const iopipe = iopipeLib({
  token: 'TOKEN_HERE',
  plugins: [tracePlugin()]
});

// wrap your lambda handler
exports.handler = iopipe((event, context) => {
  const {mark} = context.iopipe;
  mark.start('database');
  // after database call is finished
  mark.end('database');

  mark.start('analytics');
  // after analytics call is finished
  mark.end('analytics');
  context.succeed('Wow!');
});
```

## Methods

```js
// create the start mark
// the string argument is a name you are assigning the particular trace
context.iopipe.mark.start('db');

// create the end mark
// pass the name of the trace that you want to end
context.iopipe.mark.end('db');

// create an custom measurement between start:init and end:db
context.iopipe.measure('custom', 'init', 'db');
```

## Config

#### `autoHttp` (object: optional = {})

Automatically create traces and matching metadata for each http/s call made within your function invocation.

#### `autoHttp.enabled` (bool: optional = true)

HTTP/S auto-tracing is enabled by default.

#### `autoHttp.filter` (func: optional)

Filter what data is recorded for each http request that occurs within the invocation. The function will be passed an argument that is an object containing all of the data that could potentially be recorded with IOpipe. Use this object to determine:
- A. What information to record / not to record (ie filter out certain headers)
- B. If the http call should be completely excluded from trace data (ie filter out sensitive calls altogether)

```js
const iopipe = iopipeLib({
  plugins: [tracePlugin({
    autoHttp: {
      enabled: true,
      filter: (obj) => {
        // obj = {'res.url':'http://iopipe.com', res.method': 'GET'}
        // return the object with filtered keys
        // or return false to exclude the trace data completely
        return obj['res.url'].match(/restricted\.com/) ? false : obj;
      }
    }
  })]
});
```

#### `autoMeasure` (bool: optional = true)

By default, the plugin will create auto-measurements for marks with matching `mark.start` and `mark.end`. These measurements will be displayed in the [IOpipe Dashboard](https://dashboard.iopipe.com). If you'd like to turn this off, set `autoMeasure: false`.

```js
const iopipe = iopipeLib({
  plugins: [tracePlugin({
    autoMeasure: false
  })]
});
```

## Contributing
- This project uses [Prettier](https://github.com/prettier/prettier). Please execute `npm run eslint -- --fix` to auto-format the code before submitting pull requests.
