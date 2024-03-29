export declare namespace bPlistParser {
  var maxObjectCount: number;
  var maxObjectSize: number;
  type CallbackFunction<T = any> = (error: Error|null, result: [T]) => void
  export function parseFile<T = any>(fileNameOrBuffer: string|Buffer, callback?: CallbackFunction<T>): Promise<[T]>
  export function parseFileSync<T = any>(fileNameOrBuffer: string|Buffer): [T]
  export function parseBuffer<T = any>(buffer: string|Buffer): [T]
}
export default bPlistParser;
