export class QRCodePayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QRCodePayloadError";
  }
}

export class QRCodeConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QRCodeConflictError";
  }
}

export class QRCodeNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QRCodeNotFoundError";
  }
}

export class QRCodeStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QRCodeStateError";
  }
}
