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

  it('keeps a "__proto__" dictionary key as an own property', function () {
    // plistlib.dumps({"__proto__": {"isAdmin": True}, "name": "x"}, fmt=plistlib.FMT_BINARY)
    const buf = Buffer.from(
      'YnBsaXN0MDDSAQIDBllfX3Byb3RvX19UbmFtZdEEBVdpc0FkbWluCVF4CA0XHB8nKAAAAAAAAAEBAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAq',
      'base64'
    );
    const [dict] = bplist.parseBuffer(buf);
    assert.deepStrictEqual(Object.keys(dict), ['__proto__', 'name']);
    assert.equal(Object.getPrototypeOf(dict), Object.prototype);
    assert.equal(dict.isAdmin, undefined);
    assert.deepStrictEqual(Object.getOwnPropertyDescriptor(dict, '__proto__'), {
      value: { isAdmin: true },
      enumerable: true,
      writable: true,
      configurable: true
    });
    assert.equal(dict.name, 'x');
  });

  it('rejects a truncated plist header', function () {
    assert.throws(function () {
      bplist.parseBuffer(Buffer.from('bplist00'));
    }, /Invalid binary plist/);
  });

  it('rejects malformed trailer and offset table values', function () {
    const base = makeIntegerArray([{ value: 1n, bytes: 1, expected: 1 }]);
    const trailerOffset = base.length - 32;
    const tableOffset = Number(base.readBigUInt64BE(trailerOffset + 24));

    assert.throws(() => bplist.parseBuffer(replaceTrailer(base, { objectCount: 0n })), /Object count/);
    assert.throws(() => bplist.parseBuffer(replaceTrailer(base, { topObject: 0xffffffffffffffffn })), /Top object/);
    assert.throws(() => bplist.parseBuffer(replaceTrailer(base, { offsetSize: 0 })), /Offset size/);
    assert.throws(() => bplist.parseBuffer(replaceTrailer(base, { offsetSize: 255 })), /Offset size/);
    assert.throws(() => bplist.parseBuffer(replaceTrailer(base, { objectRefSize: 0 })), /Object reference size/);
    assert.throws(() => bplist.parseBuffer(replaceTrailer(base, { objectRefSize: 9 })), /Object reference size/);
    assert.throws(() => bplist.parseBuffer(replaceTrailer(base, { offsetTableOffset: BigInt(tableOffset + 1000) })), /Offset table/);
    assert.throws(() => bplist.parseBuffer(replaceFirstObjectOffset(base, 0n)), /outside/);
    assert.throws(() => bplist.parseBuffer(replaceFirstObjectOffset(base, BigInt(tableOffset))), /outside/);
    assert.throws(() => bplist.parseBuffer(replaceFirstObjectOffset(base, BigInt(tableOffset + 1000))), /outside/);
  });

  it('rejects object references outside the object table', function () {
    const root = Buffer.concat([Buffer.from([0xA1]), Buffer.from([1])]);
    assert.throws(() => bplist.parseBuffer(makeSingleObjectPlist(root)), /Object reference/);
  });

  it('rejects payloads that extend outside the object data area', function () {
    assert.throws(() => bplist.parseBuffer(makeSingleObjectPlist(Buffer.from([0x14, 1, 2]))), /integer extends outside/);
    assert.throws(() => bplist.parseBuffer(makeSingleObjectPlist(Buffer.concat([Buffer.from([0x23]), Buffer.alloc(7)]))), /real extends outside/);
    assert.throws(() => bplist.parseBuffer(makeSingleObjectPlist(Buffer.from([0x33, 1]))), /date extends outside/);
    assert.throws(() => bplist.parseBuffer(makeSingleObjectPlist(Buffer.from([0x83, 1, 2]))), /UID extends outside/);
  });

  it('rejects unsupported integer, date, and extended length markers', function () {
    assert.throws(() => bplist.parseBuffer(makeSingleObjectPlist(Buffer.concat([Buffer.from([0x15]), Buffer.alloc(32)]))), /Unsupported integer length/);
    assert.throws(() => bplist.parseBuffer(makeSingleObjectPlist(Buffer.concat([Buffer.from([0x34]), Buffer.alloc(8)]))), /Unsupported date length marker/);

    for (const marker of [0x4F, 0x5F, 0x6F, 0xAF, 0xDF]) {
      const object = Buffer.concat([Buffer.from([marker, 0x14]), Buffer.alloc(16)]);
      assert.throws(() => bplist.parseBuffer(makeSingleObjectPlist(object)), /Unsupported \w+ length width/);
    }

    assert.throws(() => bplist.parseBuffer(makeSingleObjectPlist(Buffer.from([0x4F, 0x24]))), /Unexpected data length marker type/);
  });

  it('parses UIDs larger than 2^53 without losing precision', function () {
    const cases = [
      { value: 0n, bytes: 1 },
      { value: 255n, bytes: 1 },
      { value: 256n, bytes: 2 },
      { value: 4294967296n, bytes: 8 },
      { value: 2n ** 63n, bytes: 8 }
    ];

    for (const {value, bytes} of cases) {
      const object = Buffer.concat([Buffer.from([0x80 | (bytes - 1)]), writeUIntBE(value, bytes)]);
      const [parsed] = bplist.parseBuffer(makeSingleObjectPlist(object));
      const expected = value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : value;
      assert.strictEqual(parsed.UID, expected);
    }
  });

  it('rejects UIDs wider than 8 bytes', function () {
    const object = Buffer.concat([Buffer.from([0x88]), writeUIntBE(1n, 9)]);
    assert.throws(() => bplist.parseBuffer(makeSingleObjectPlist(object)), /UID length/);
  });

  it('preserves negative zero reals', function () {
    const payload = Buffer.alloc(8);
    payload.writeDoubleBE(-0, 0);
    const [parsed] = bplist.parseBuffer(makeSingleObjectPlist(Buffer.concat([Buffer.from([0x23]), payload])));
    assert.ok(Object.is(parsed, -0));
  });

  it('rejects unsupported real widths', function () {
    for (const info of [0, 1, 4, 5]) {
      const object = Buffer.concat([Buffer.from([0x20 | info]), Buffer.alloc(2 ** info)]);
      assert.throws(() => bplist.parseBuffer(makeSingleObjectPlist(object)), /Unsupported real length/);
    }
  });
});

type TrailerOverrides = {
  objectCount?: bigint;
  topObject?: bigint;
  offsetSize?: number;
  objectRefSize?: number;
  offsetTableOffset?: bigint;
};

function makeSingleObjectPlist(object: Buffer): Buffer {
  const offsetTableOffset = 8 + object.length;
  const offsetSize = byteWidth(offsetTableOffset);
  const trailer = Buffer.concat([
    Buffer.alloc(6),
    Buffer.from([offsetSize, 1]),
    writeUIntBE(1, 8),
    writeUIntBE(0, 8),
    writeUIntBE(offsetTableOffset, 8)
  ]);

  return Buffer.concat([
    Buffer.from('bplist00'),
    object,
    writeUIntBE(8, offsetSize),
    trailer
  ]);
}

function replaceTrailer(input: Buffer, overrides: TrailerOverrides): Buffer {
  const result = Buffer.from(input);
  const trailerOffset = result.length - 32;

  if (overrides.objectCount !== undefined) {
    writeUIntBE(overrides.objectCount, 8).copy(result, trailerOffset + 8);
  }
  if (overrides.topObject !== undefined) {
    writeUIntBE(overrides.topObject, 8).copy(result, trailerOffset + 16);
  }
  if (overrides.offsetSize !== undefined) {
    result[trailerOffset + 6] = overrides.offsetSize;
  }
  if (overrides.objectRefSize !== undefined) {
    result[trailerOffset + 7] = overrides.objectRefSize;
  }
  if (overrides.offsetTableOffset !== undefined) {
    writeUIntBE(overrides.offsetTableOffset, 8).copy(result, trailerOffset + 24);
  }
  return result;
}

function replaceFirstObjectOffset(input: Buffer, value: bigint): Buffer {
  const result = Buffer.from(input);
  const trailerOffset = result.length - 32;
  const offsetSize = result[trailerOffset + 6];
  const tableOffset = Number(result.readBigUInt64BE(trailerOffset + 24));
  writeUIntBE(value, offsetSize).copy(result, tableOffset);
  return result;
}

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
