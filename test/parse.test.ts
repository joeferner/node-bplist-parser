// tests are adapted from https://github.com/TooTallNate/node-plist

import assert from 'node:assert';
import path from 'node:path';
import { describe, it } from 'vitest';
import * as bplist from '../bplistParser.js';

const dirname = import.meta.dirname;

describe('bplist-parser', function () {
  it('iTunes Small', async function () {
    const file = path.join(dirname, "iTunes-small.bplist");
    const startTime1 = new Date();

    const [dict] = await bplist.parseFile(file);
    const endTime = new Date();
    console.log('Parsed "' + file + '" in ' + (endTime.getTime() - startTime1.getTime()) + 'ms');
    assert.equal(dict['Application Version'], "9.0.3");
    assert.equal(dict['Library Persistent ID'], "6F81D37F95101437");
    assert.deepEqual(dict, bplist.parseFileSync(file)[0]);
  });

  it('sample1', async function () {
    const file = path.join(dirname, "sample1.bplist");
    const startTime = new Date();

    const [dict] = await bplist.parseFile(file);
    const endTime = new Date();
    console.log('Parsed "' + file + '" in ' + (endTime.getTime() - startTime.getTime()) + 'ms');

    assert.equal(dict['CFBundleIdentifier'], 'com.apple.dictionary.MySample');
    assert.deepEqual(dict, bplist.parseFileSync(file)[0]);
  });

  it('sample2', async function () {
    const file = path.join(dirname, "sample2.bplist");
    const startTime = new Date();

    const [dict] = await bplist.parseFile(file);
    const endTime = new Date();
    console.log('Parsed "' + file + '" in ' + (endTime.getTime() - startTime.getTime()) + 'ms');

    assert.equal(dict['PopupMenu'][2]['Key'], "\n        #import <Cocoa/Cocoa.h>\n\n#import <MacRuby/MacRuby.h>\n\nint main(int argc, char *argv[])\n{\n  return macruby_main(\"rb_main.rb\", argc, argv);\n}\n");
    assert.deepEqual(dict, bplist.parseFileSync(file)[0]);
  });

  it('airplay', async function () {
    const file = path.join(dirname, "airplay.bplist");
    const startTime = new Date();

    const [dict] = await bplist.parseFile(file);
    const endTime = new Date();
    console.log('Parsed "' + file + '" in ' + (endTime.getTime() - startTime.getTime()) + 'ms');

    assert.equal(dict['duration'], 5555.0495000000001);
    assert.equal(dict['position'], 4.6269989039999997);
    assert.deepEqual(dict, bplist.parseFileSync(file)[0]);
  });

  it('utf16', async function () {
    const file = path.join(dirname, "utf16.bplist");
    const startTime = new Date();

    const [dict] = await bplist.parseFile(file);
    const endTime = new Date();
    console.log('Parsed "' + file + '" in ' + (endTime.getTime() - startTime.getTime()) + 'ms');

    assert.equal(dict['CFBundleName'], 'sellStuff');
    assert.equal(dict['CFBundleShortVersionString'], '2.6.1');
    assert.equal(dict['NSHumanReadableCopyright'], '©2008-2012, sellStuff, Inc.');
    assert.deepEqual(dict, bplist.parseFileSync(file)[0]);
  });

  it('utf16chinese', async function () {
    const file = path.join(dirname, "utf16_chinese.plist");
    const startTime = new Date();

    const [dict] = await bplist.parseFile(file);
    const endTime = new Date();
    console.log('Parsed "' + file + '" in ' + (endTime.getTime() - startTime.getTime()) + 'ms');

    assert.equal(dict['CFBundleName'], '天翼阅读');
    assert.equal(dict['CFBundleDisplayName'], '天翼阅读');
    assert.deepEqual(dict, bplist.parseFileSync(file)[0]);
  });

  it('uid', async function () {
    const file = path.join(dirname, "uid.bplist");
    const startTime = new Date();

    const [dict] = await bplist.parseFile(file);
    const endTime = new Date();
    console.log('Parsed "' + file + '" in ' + (endTime.getTime() - startTime.getTime()) + 'ms');

    assert.deepEqual(dict['$objects'][1]['NS.keys'], [{UID:2}, {UID:3}, {UID:4}]);
    assert.deepEqual(dict['$objects'][1]['NS.objects'], [{UID: 5}, {UID:6}, {UID:7}]);
    assert.deepEqual(dict['$top']['root'], {UID:1});
    assert.deepEqual(dict, bplist.parseFileSync(file)[0]);
  });

  it('int64', async function () {
    const file = path.join(dirname, "int64.bplist");
    const startTime = new Date();

    const [dict] = await bplist.parseFile(file);
    const endTime = new Date();
    console.log('Parsed "' + file + '" in ' + (endTime.getTime() - startTime.getTime()) + 'ms');

    assert.equal(dict['zero'], '0');
    assert.equal(dict['int32item'], '1234567890');
    assert.equal(dict['int32itemsigned'], '-1234567890');
    assert.equal(dict['int64item'], '12345678901234567890');
    assert.deepEqual(dict, bplist.parseFileSync(file)[0]);
  });

  it('unsigned integer widths', function () {
    const cases = [
      { value: 0n, bytes: 1, expected: 0 },
      { value: 255n, bytes: 1, expected: 255 },
      { value: 256n, bytes: 2, expected: 256 },
      { value: 65535n, bytes: 2, expected: 65535 },
      { value: 65536n, bytes: 4, expected: 65536 },
      { value: 2147483647n, bytes: 4, expected: 2147483647 },
      { value: 2147483648n, bytes: 4, expected: 2147483648 },
      { value: 4294967295n, bytes: 4, expected: 4294967295 },
      { value: 4294967296n, bytes: 8, expected: 4294967296 },
      { value: 9007199254740991n, bytes: 8, expected: Number.MAX_SAFE_INTEGER },
      { value: 9223372036854775807n, bytes: 8, expected: 9223372036854775807n },
      { value: 9223372036854775808n, bytes: 16, expected: 9223372036854775808n },
      { value: 18446744073709551615n, bytes: 16, expected: 18446744073709551615n }
    ];

    const [values] = bplist.parseBuffer(makeIntegerArray(cases));
    assert.deepStrictEqual(values, cases.map(({expected}) => expected));
  });

  it('signed 64-bit integers', function () {
    const cases = [
      { value: -1n, bytes: 8, expected: -1 },
      { value: -2147483648n, bytes: 8, expected: -2147483648 },
      { value: -2147483649n, bytes: 8, expected: -2147483649 },
      { value: -9007199254740991n, bytes: 8, expected: Number.MIN_SAFE_INTEGER },
      { value: -9223372036854775808n, bytes: 8, expected: -9223372036854775808n }
    ];

    const [values] = bplist.parseBuffer(makeIntegerArray(cases));
    assert.deepStrictEqual(values, cases.map(({expected}) => expected));
  });

  it('rejects a truncated plist header', function () {
    assert.throws(function () {
      bplist.parseBuffer(Buffer.from('bplist00'));
    }, /Invalid binary plist/);
  });
});

type IntegerCase = { value: bigint; bytes: number; expected: number | bigint };

function makeIntegerArray(cases: IntegerCase[]): Buffer {
  if (cases.length >= 15) {
    throw new Error('test helper only supports short arrays');
  }

  const objectRefSize = byteWidth(cases.length);
  const root = Buffer.concat([
    Buffer.from([0xA0 | cases.length]),
    ...cases.map((_, index) => writeUIntBE(index + 1, objectRefSize))
  ]);
  const objects = [root, ...cases.map(({value, bytes}) => makeIntegerObject(value, bytes))];
  const offsets: number[] = [];
  let offset = 8;

  for (const object of objects) {
    offsets.push(offset);
    offset += object.length;
  }

  const offsetTableOffset = offset;
  const offsetSize = byteWidth(offsetTableOffset);
  const offsetTable = Buffer.concat(offsets.map((entryOffset) => writeUIntBE(entryOffset, offsetSize)));
  const trailer = Buffer.concat([
    Buffer.alloc(6),
    Buffer.from([offsetSize, objectRefSize]),
    writeUIntBE(objects.length, 8),
    writeUIntBE(0, 8),
    writeUIntBE(offsetTableOffset, 8)
  ]);

  return Buffer.concat([
    Buffer.from('bplist00'),
    ...objects,
    offsetTable,
    trailer
  ]);
}

function makeIntegerObject(value: bigint, byteLength: number): Buffer {
  const widthInfo: Record<number, number> = {
    1: 0,
    2: 1,
    4: 2,
    8: 3,
    16: 4
  };
  if (!Object.prototype.hasOwnProperty.call(widthInfo, byteLength)) {
    throw new Error('unsupported integer width: ' + byteLength);
  }

  return Buffer.concat([
    Buffer.from([0x10 | widthInfo[byteLength]]),
    writeUIntBE(value, byteLength)
  ]);
}

function writeUIntBE(value: bigint | number, byteLength: number): Buffer {
  let integer = BigInt(value);

  if (integer < 0n) {
    integer = (1n << BigInt(byteLength * 8)) + integer;
  }

  const buffer = Buffer.alloc(byteLength);
  for (let index = byteLength - 1; index >= 0; index--) {
    buffer[index] = Number(integer & 0xffn);
    integer >>= 8n;
  }
  return buffer;
}

function byteWidth(value: number): number {
  if (value <= 0xff) {
    return 1;
  }
  if (value <= 0xffff) {
    return 2;
  }
  if (value <= 0xffffffff) {
    return 4;
  }
  return 8;
}
