export class DecodeTransformError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DecodeTransformError";
  }
}
