export class LandingPageConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LandingPageConflictError";
  }
}

export class LandingPageNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LandingPageNotFoundError";
  }
}

export class LandingPageStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LandingPageStateError";
  }
}
