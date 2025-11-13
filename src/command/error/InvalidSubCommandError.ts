export class InvalidSubCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSubCommandError";
  }
}
