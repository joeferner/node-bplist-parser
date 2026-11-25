// adapted from https://github.com/3breadt/dd-plist

import fs from 'node:fs';
const debug = false;

export let maxObjectSize = 100 * 1000 * 1000; // 100Meg
export let maxObjectCount = 32768;
// Objects are addressed by index, so one stored object can be referenced many
// times. maxObjectCount bounds how many objects are *stored*, not how many are
// *expanded*, and a small file can therefore describe a very large tree (each
// level referencing the level below twice gives 2^n expansions from n objects).
// This caps the total expansion instead.
export let maxExpandedObjectCount = 1000000;

// Exported bindings are read-only to consumers (an ESM import binding cannot be
// assigned, and the CommonJS build exposes exports as getters), so these knobs
// are tuned through setters rather than by assigning to the exports.
export function setMaxObjectSize(value: number): void {
  maxObjectSize = value;
}

export function setMaxObjectCount(value: number): void {
  maxObjectCount = value;
}

export function setMaxExpandedObjectCount(value: number): void {
  maxExpandedObjectCount = value;
}

// EPOCH = new SimpleDateFormat("yyyy MM dd zzz").parse("2001 01 01 GMT").getTime();
// ...but that's annoying in a static initializer because it can throw exceptions, ick.
// So we just hardcode the correct value.
const EPOCH = 978307200000;

/** Wrapper for a CoreFoundation keyed-archiver UID value. */
export class UID {
  UID: number | bigint;

  constructor(id: number | bigint) {
    this.UID = id;
  }
}

export type CallbackFunction<T = any> = (error: Error | null, result?: [T]) => void;

export function parseFile<T = any>(
  fileNameOrBuffer: string | Buffer,
  callback?: CallbackFunction<T>
): Promise<[T]> {
  return new Promise<[T]>(function (resolve, reject) {
    function tryParseBuffer(buffer: Buffer) {
      let err: Error | null = null;
      let result: [T] | undefined;
      try {
        result = parseBuffer<T>(buffer);
        resolve(result);
      } catch (ex) {
        err = ex as Error;
        reject(err);
      } finally {
        if (callback) callback(err, result);
      }
    }

    if (Buffer.isBuffer(fileNameOrBuffer)) {
      return tryParseBuffer(fileNameOrBuffer);
    }
    fs.readFile(fileNameOrBuffer, function (err, data) {
      if (err) {
        reject(err);
        if (callback) callback(err);
        return;
      }
      tryParseBuffer(data);
    });
  });
}

export function parseFileSync<T = any>(fileNameOrBuffer: string | Buffer): [T] {
  const buffer = Buffer.isBuffer(fileNameOrBuffer) ? fileNameOrBuffer : fs.readFileSync(fileNameOrBuffer);
  return parseBuffer<T>(buffer);
}

export function parseBuffer<T = any>(buffer: Buffer): [T] {
  // check header
  const header = buffer.slice(0, 'bplist00'.length).toString('utf8');
  if (header !== 'bplist00') {
    throw new Error("Invalid binary plist. Expected 'bplist00' at offset 0.");
  }
  if (buffer.length < 'bplist00'.length + 32) {
    throw new Error("Invalid binary plist. Expected a trailer.");
  }

  // Handle trailer, last 32 bytes of the file
  const trailer = buffer.slice(buffer.length - 32, buffer.length);
  // 6 null bytes (index 0 to 5)
  const offsetSize = trailer.readUInt8(6);
  if (debug) {
    console.log("offsetSize: " + offsetSize);
  }
  if (offsetSize < 1 || offsetSize > 8) {
    throw new Error("Invalid binary plist. Offset size must be between 1 and 8.");
  }
  const objectRefSize = trailer.readUInt8(7);
  if (debug) {
    console.log("objectRefSize: " + objectRefSize);
  }
  if (objectRefSize < 1 || objectRefSize > 8) {
    throw new Error("Invalid binary plist. Object reference size must be between 1 and 8.");
  }
  const numObjectsValue = readUInt64BE(trailer, 8);
  if (debug) {
    console.log("numObjects: " + numObjectsValue);
  }
  if (numObjectsValue === 0n) {
    throw new Error("Invalid binary plist. Object count must be at least 1.");
  }
  if (numObjectsValue > BigInt(maxObjectCount)) {
    throw new Error("maxObjectCount exceeded");
  }
  const numObjects = Number(numObjectsValue);
  const topObjectValue = readUInt64BE(trailer, 16);
  if (debug) {
    console.log("topObject: " + topObjectValue);
  }
  if (topObjectValue >= numObjectsValue) {
    throw new Error("Invalid binary plist. Top object is outside the object table.");
  }
  const topObject = Number(topObjectValue);
  const offsetTableOffsetValue = readUInt64BE(trailer, 24);
  if (debug) {
    console.log("offsetTableOffset: " + offsetTableOffsetValue);
  }
  const offsetTableSize = BigInt(numObjects * offsetSize);
  const objectDataEndValue = BigInt(buffer.length - 32);
  if (offsetTableOffsetValue < 8n || offsetTableOffsetValue + offsetTableSize > objectDataEndValue) {
    throw new Error("Invalid binary plist. Offset table is outside the object data area.");
  }
  const offsetTableOffset = Number(offsetTableOffsetValue);

  // Handle offset table
  const offsetTable: number[] = [];

  for (let i = 0; i < numObjects; i++) {
    const offsetBytes = buffer.slice(offsetTableOffset + i * offsetSize, offsetTableOffset + (i + 1) * offsetSize);
    const objectOffsetValue = readBigUInt(offsetBytes);
    if (objectOffsetValue < 8n || objectOffsetValue >= offsetTableOffsetValue) {
      throw new Error("Invalid binary plist. Object #" + i + " has an offset outside the object data area.");
    }
    offsetTable[i] = Number(objectOffsetValue);
    if (debug) {
      console.log("Offset for Object #" + i + " is " + offsetTable[i] + " [" + offsetTable[i].toString(16) + "]");
    }
  }

  // Parses an object inside the currently parsed binary property list.
  // For the format specification check
  // <a href="https://www.opensource.apple.com/source/CF/CF-635/CFBinaryPList.c">
  // Apple's binary property list parser implementation</a>.
  // Guards against a small file describing an unbounded object graph: an
  // expansion budget (a DAG that references each level twice expands to 2^n)
  // and a cycle check (an object that transitively references itself would
  // otherwise recurse until the stack overflows).
  let expandedObjectCount = 0;
  const objectsBeingParsed = new Set<number>();

  function parseObject(tableOffset: number): any {
    if (!Number.isInteger(tableOffset) || tableOffset < 0 || tableOffset >= offsetTable.length) {
      throw new Error("Invalid binary plist. Object reference is outside the object table.");
    }
    if (++expandedObjectCount > maxExpandedObjectCount) {
      throw new Error("maxExpandedObjectCount exceeded");
    }
    if (objectsBeingParsed.has(tableOffset)) {
      throw new Error("Circular reference detected at object #" + tableOffset);
    }
    objectsBeingParsed.add(tableOffset);
    try {
      return parseObjectAt(tableOffset);
    } finally {
      objectsBeingParsed.delete(tableOffset);
    }
  }

  function parseObjectAt(tableOffset: number): any {
    const offset = offsetTable[tableOffset];
    if (offset < 8 || offset >= offsetTableOffset || offset >= buffer.length) {
      throw new Error("Invalid binary plist. Object offset is outside the object data area.");
    }
    const type = buffer[offset];
    const objType = (type & 0xF0) >> 4; //First  4 bits
    const objInfo = (type & 0x0F);      //Second 4 bits

    function readObjectBytes(start: number, length: number, name: string): Buffer {
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(length) || start < 8 || length < 0 || start + length > offsetTableOffset) {
        throw new Error("Invalid binary plist. " + name + " extends outside the object data area.");
      }
      return buffer.subarray(start, start + length);
    }

    switch (objType) {
    case 0x0:
      return parseSimple();
    case 0x1:
      return parseInteger();
    case 0x8:
      return parseUID();
    case 0x2:
      return parseReal();
    case 0x3:
      return parseDate();
    case 0x4:
      return parseData();
    case 0x5: // ASCII
      return parsePlistString();
    case 0x6: // UTF-16
      return parsePlistString(true);
    case 0xA:
      return parseArray();
    case 0xD:
      return parseDictionary();
    default:
      throw new Error("Unhandled type 0x" + objType.toString(16));
    }

    function parseSimple(): any {
      //Simple
      switch (objInfo) {
      case 0x0: // null
        return null;
      case 0x8: // false
        return false;
      case 0x9: // true
        return true;
      case 0xF: // filler byte
        return null;
      default:
        throw new Error("Unhandled simple type 0x" + objType.toString(16));
      }
    }

    function parseInteger(): number | bigint {
      const length = Math.pow(2, objInfo);
      if (length > 16) {
        throw new Error("Invalid binary plist. Unsupported integer length: " + length);
      }
      return readInteger(readObjectBytes(offset + 1, length, "integer"));
    }

    function parseUID(): UID {
      const length = objInfo + 1;
      if (length > 8) {
        throw new Error("Invalid binary plist. UID length must be between 1 and 8 bytes.");
      }
      return new UID(simplifyInteger(readBigUInt(readObjectBytes(offset + 1, length, "UID"))));
    }

    function parseReal(): number | undefined {
      const length = Math.pow(2, objInfo);
      const realBuffer = readObjectBytes(offset + 1, length, "real");
      if (length === 4) {
        return realBuffer.readFloatBE(0);
      }
      if (length === 8) {
        return realBuffer.readDoubleBE(0);
      }
    }

    function parseDate(): Date {
      if (objInfo !== 0x3) {
        throw new Error("Invalid binary plist. Unsupported date length marker: " + objInfo);
      }
      const dateBuffer = readObjectBytes(offset + 1, 8, "date");
      return new Date(EPOCH + (1000 * dateBuffer.readDoubleBE(0)));
    }

    function parseData(): Buffer {
      let dataOffset = 1;
      let lengthValue = BigInt(objInfo);
      if (objInfo === 0xF) {
        const intTypeByte = readObjectBytes(offset + 1, 1, "data length marker")[0];
        const intType = (intTypeByte & 0xF0) >> 4;
        if (intType !== 0x1) {
          throw new Error("Invalid binary plist. Unexpected data length marker type: " + intType);
        }
        const intInfo = intTypeByte & 0x0F;
        const intLength = Math.pow(2, intInfo);
        if (intLength > 8) {
          throw new Error("Invalid binary plist. Unsupported data length width: " + intLength);
        }
        dataOffset = 2 + intLength;
        lengthValue = readBigUInt(readObjectBytes(offset + 2, intLength, "data length"));
      }
      if (lengthValue > BigInt(maxObjectSize)) {
        throw new Error("Too little heap space available! Wanted to read " + lengthValue + " bytes, but only " + maxObjectSize + " are available.");
      }
      return readObjectBytes(offset + dataOffset, Number(lengthValue), "data");
    }

    function parsePlistString(isUtf16?: boolean): string {
      const utf16Flag = isUtf16 || false;
      let enc: BufferEncoding = "utf8";
      let lengthValue = BigInt(objInfo);
      let stringOffset = 1;
      if (objInfo === 0xF) {
        const intTypeByte = readObjectBytes(offset + 1, 1, "string length marker")[0];
        const intType = (intTypeByte & 0xF0) >> 4;
        if (intType !== 0x1) {
          throw new Error("Invalid binary plist. Unexpected string length marker type: " + intType);
        }
        const intInfo = intTypeByte & 0x0F;
        const intLength = Math.pow(2, intInfo);
        if (intLength > 8) {
          throw new Error("Invalid binary plist. Unsupported string length width: " + intLength);
        }
        stringOffset = 2 + intLength;
        lengthValue = readBigUInt(readObjectBytes(offset + 2, intLength, "string length"));
      }
      lengthValue *= utf16Flag ? 2n : 1n;
      if (lengthValue > BigInt(maxObjectSize)) {
        throw new Error("Too little heap space available! Wanted to read " + lengthValue + " bytes, but only " + maxObjectSize + " are available.");
      }
      let plistString = Buffer.from(readObjectBytes(offset + stringOffset, Number(lengthValue), "string"));
      if (utf16Flag) {
        plistString = swapBytes(plistString);
        enc = "ucs2";
      }
      return plistString.toString(enc);
    }

    function parseArray(): any[] {
      let lengthValue = BigInt(objInfo);
      let arrayOffset = 1;
      if (objInfo === 0xF) {
        const intTypeByte = readObjectBytes(offset + 1, 1, "array length marker")[0];
        const intType = (intTypeByte & 0xF0) >> 4;
        if (intType !== 0x1) {
          throw new Error("Invalid binary plist. Unexpected array length marker type: " + intType);
        }
        const intInfo = intTypeByte & 0x0F;
        const intLength = Math.pow(2, intInfo);
        if (intLength > 8) {
          throw new Error("Invalid binary plist. Unsupported array length width: " + intLength);
        }
        arrayOffset = 2 + intLength;
        lengthValue = readBigUInt(readObjectBytes(offset + 2, intLength, "array length"));
      }
      const refsSize = lengthValue * BigInt(objectRefSize);
      if (refsSize > BigInt(maxObjectSize)) {
        throw new Error("Too little heap space available!");
      }
      const length = Number(lengthValue);
      const refs = readObjectBytes(offset + arrayOffset, Number(refsSize), "array references");
      const array: any[] = [];
      for (let i = 0; i < length; i++) {
        const objRef = readUInt(refs.subarray(i * objectRefSize, (i + 1) * objectRefSize));
        array[i] = parseObject(objRef);
      }
      return array;
    }

    function parseDictionary(): Record<string, any> {
      let lengthValue = BigInt(objInfo);
      let dictOffset = 1;
      if (objInfo === 0xF) {
        const intTypeByte = readObjectBytes(offset + 1, 1, "dictionary length marker")[0];
        const intType = (intTypeByte & 0xF0) >> 4;
        if (intType !== 0x1) {
          throw new Error("Invalid binary plist. Unexpected dictionary length marker type: " + intType);
        }
        const intInfo = intTypeByte & 0x0F;
        const intLength = Math.pow(2, intInfo);
        if (intLength > 8) {
          throw new Error("Invalid binary plist. Unsupported dictionary length width: " + intLength);
        }
        dictOffset = 2 + intLength;
        lengthValue = readBigUInt(readObjectBytes(offset + 2, intLength, "dictionary length"));
      }
      const refsSize = lengthValue * 2n * BigInt(objectRefSize);
      if (refsSize > BigInt(maxObjectSize)) {
        throw new Error("Too little heap space available!");
      }
      const length = Number(lengthValue);
      const refs = readObjectBytes(offset + dictOffset, Number(refsSize), "dictionary references");
      if (debug) {
        console.log("Parsing dictionary #" + tableOffset);
      }
      const dict: Record<string, any> = {};
      for (let i = 0; i < length; i++) {
        const keyRef = readUInt(refs.subarray(i * objectRefSize, (i + 1) * objectRefSize));
        const valRef = readUInt(refs.subarray((length + i) * objectRefSize, (length + i + 1) * objectRefSize));
        const key = parseObject(keyRef);
        const val = parseObject(valRef);
        if (debug) {
          console.log("  DICT #" + tableOffset + ": Mapped " + key + " to " + val);
        }
        // not `dict[key] = val`: for "__proto__" (or a key that coerces to
        // it) that calls the prototype setter instead of adding the key
        Object.defineProperty(dict, key, { value: val, enumerable: true, writable: true, configurable: true });
      }
      return dict;
    }
  }

  return [ parseObject(topObject) ];
}

function readUInt(buffer: Buffer, start?: number): number {
  start = start || 0;

  let l = 0;
  for (let i = start; i < buffer.length; i++) {
    l = (l * 0x100) + buffer[i];
  }
  return l;
}

function readBigUInt(buffer: Buffer): bigint {
  let value = 0n;
  for (const byte of buffer) {
    value = (value << 8n) | BigInt(byte);
  }
  return value;
}

function simplifyInteger(value: bigint): number | bigint {
  if (value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number(value);
  }
  return value;
}

function readInteger(buffer: Buffer): number | bigint {
  let value = readBigUInt(buffer);

  if (buffer.length === 8 && (buffer[0] & 0x80)) {
    value -= 1n << 64n;
  }

  return simplifyInteger(value);
}

function readUInt64BE(buffer: Buffer, start: number): bigint {
  return readBigUInt(buffer.subarray(start, start + 8));
}

function swapBytes<T extends Buffer>(buffer: T): T {
  const len = buffer.length;
  for (let i = 0; i < len; i += 2) {
    const a = buffer[i];
    buffer[i] = buffer[i+1];
    buffer[i+1] = a;
  }
  return buffer;
}
