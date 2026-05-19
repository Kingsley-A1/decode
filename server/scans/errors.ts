export class ScanImageDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScanImageDecodeError";
  }
}

export class ScanImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScanImageValidationError";
  }
}
