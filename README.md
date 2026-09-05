# bplist-parser

[![CI](https://github.com/joeferner/node-bplist-parser/actions/workflows/ci.yml/badge.svg)](https://github.com/joeferner/node-bplist-parser/actions/workflows/ci.yml)

Binary Mac OS X Plist (property list) parser.

## Installation

```bash
$ npm install bplist-parser
```

## Quick Examples

This package ships both ES module and CommonJS builds, so either import style works.

```javascript
// ESM
import { parseFile } from 'bplist-parser';

const [obj] = await parseFile('myPlist.bplist');
console.log(JSON.stringify(obj));
```

```javascript
// CommonJS
const bplist = require('bplist-parser');

(async () => {
  const [obj] = await bplist.parseFile('myPlist.bplist');
  console.log(JSON.stringify(obj));
})();
```

`parseFileSync` and `parseBuffer` are also exported, and both return an array of
the plist's root objects.

## Integers

Integer values are returned as a plain `number` when they fit within
`Number.MAX_SAFE_INTEGER`, and as a native `bigint` when they don't. The type of
a given field depends on the value stored in the plist, not on its declared
byte width, so code that consumes parsed output should be prepared to handle
either type for any integer field.

In particular, `JSON.stringify` throws on `bigint` values ("Do not know how to
serialize a BigInt"). If you serialize parsed results to JSON, use a
[replacer function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#the_replacer_parameter)
to convert `bigint`s to strings or numbers first:

```javascript
JSON.stringify(obj, (_key, value) => typeof value === 'bigint' ? value.toString() : value);
```

> **Note:** before 0.5.0, integers too large for `Number.MAX_SAFE_INTEGER` were
> wrapped in a `big-integer` instance instead of a plain `bigint`.

## Limits

The parser refuses plists that would allocate more than `maxObjectSize` bytes or
contain more than `maxObjectCount` objects. Both are readable as exports and
adjusted through setters:

```javascript
import { setMaxObjectSize, setMaxObjectCount } from 'bplist-parser';

setMaxObjectSize(200 * 1000 * 1000);
setMaxObjectCount(65536);
```

> **Note:** before 0.4.0 these were assignable (`bplist.maxObjectSize = n`).
> Exported bindings are read-only in both module systems now, so assignment must
> be replaced with the setters above.

## Requirements

Node.js 20.19 or newer.

## License

(The MIT License)

Copyright (c) 2012 Near Infinity Corporation

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
