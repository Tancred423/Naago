export class InvalidHelpPageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidHelpPageError";
  }
}
