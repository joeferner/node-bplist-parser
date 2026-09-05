export type CallbackFunction<T = any> = (error: Error | null, result: [T]) => void;

/** Maximum size, in bytes, of an object the parser will allocate. Read-only; use {@link setMaxObjectSize}. */
export declare const maxObjectSize: number;

/** Maximum number of objects the parser will read from a plist. Read-only; use {@link setMaxObjectCount}. */
export declare const maxObjectCount: number;

export declare function setMaxObjectSize(value: number): void;

export declare function setMaxObjectCount(value: number): void;

/** Wrapper for a CoreFoundation keyed-archiver UID value. */
export declare class UID {
  constructor(id: number);
  UID: number;
}

export declare function parseFile<T = any>(
  fileNameOrBuffer: string | Buffer,
  callback?: CallbackFunction<T>
): Promise<[T]>;

export declare function parseFileSync<T = any>(fileNameOrBuffer: string | Buffer): [T];

export declare function parseBuffer<T = any>(buffer: string | Buffer): [T];
