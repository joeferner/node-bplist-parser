'use strict';

// tests are adapted from https://github.com/TooTallNate/node-plist

import assert from 'assert';
import path from 'path';
import * as bplist from '../bplistParser.js';

const dirname = path.dirname(new URL(import.meta.url).pathname);

describe('bplist-parser', function () {
  it('iTunes Small', async function () {
    const file = path.join(dirname, "iTunes-small.bplist");
    const startTime1 = new Date();

    const [dict] = await bplist.parseFile(file);
    const endTime = new Date();
    console.log('Parsed "' + file + '" in ' + (endTime - startTime1) + 'ms');
    assert.equal(dict['Application Version'], "9.0.3");
    assert.equal(dict['Library Persistent ID'], "6F81D37F95101437");
    assert.deepEqual(dict, bplist.parseFileSync(file)[0]);
  });

  it('sample1', async function () {
    const file = path.join(dirname, "sample1.bplist");
    const startTime = new Date();

    const [dict] = await bplist.parseFile(file);
    const endTime = new Date();
    console.log('Parsed "' + file + '" in ' + (endTime - startTime) + 'ms');

    assert.equal(dict['CFBundleIdentifier'], 'com.apple.dictionary.MySample');
    assert.deepEqual(dict, bplist.parseFileSync(file)[0]);
  });

  it('sample2', async function () {
    const file = path.join(dirname, "sample2.bplist");
    const startTime = new Date();

    const [dict] = await bplist.parseFile(file);
    const endTime = new Date();
    console.log('Parsed "' + file + '" in ' + (endTime - startTime) + 'ms');

    assert.equal(dict['PopupMenu'][2]['Key'], "\n        #import <Cocoa/Cocoa.h>\n\n#import <MacRuby/MacRuby.h>\n\nint main(int argc, char *argv[])\n{\n  return macruby_main(\"rb_main.rb\", argc, argv);\n}\n");
    assert.deepEqual(dict, bplist.parseFileSync(file)[0]);
  });

  it('airplay', async function () {
    const file = path.join(dirname, "airplay.bplist");
    const startTime = new Date();

    const [dict] = await bplist.parseFile(file);
    const endTime = new Date();
    console.log('Parsed "' + file + '" in ' + (endTime - startTime) + 'ms');

    assert.equal(dict['duration'], 5555.0495000000001);
    assert.equal(dict['position'], 4.6269989039999997);
    assert.deepEqual(dict, bplist.parseFileSync(file)[0]);
  });

  it('utf16', async function () {
    const file = path.join(dirname, "utf16.bplist");
    const startTime = new Date();

    const [dict] = await bplist.parseFile(file);
    const endTime = new Date();
    console.log('Parsed "' + file + '" in ' + (endTime - startTime) + 'ms');

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
    console.log('Parsed "' + file + '" in ' + (endTime - startTime) + 'ms');

    assert.equal(dict['CFBundleName'], '天翼阅读');
    assert.equal(dict['CFBundleDisplayName'], '天翼阅读');
    assert.deepEqual(dict, bplist.parseFileSync(file)[0]);
  });

  it('uid', async function () {
    const file = path.join(dirname, "uid.bplist");
    const startTime = new Date();

    const [dict] = await bplist.parseFile(file);
    const endTime = new Date();
    console.log('Parsed "' + file + '" in ' + (endTime - startTime) + 'ms');

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
    console.log('Parsed "' + file + '" in ' + (endTime - startTime) + 'ms');

    assert.equal(dict['zero'], '0');
    assert.equal(dict['int32item'], '1234567890');
    assert.equal(dict['int32itemsigned'], '-1234567890');
    assert.equal(dict['int64item'], '12345678901234567890');
    assert.deepEqual(dict, bplist.parseFileSync(file)[0]);
  });
});
