export class AssetNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssetNotFoundError";
  }
}

export class AssetStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssetStateError";
  }
}

export class AssetValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssetValidationError";
  }
}
