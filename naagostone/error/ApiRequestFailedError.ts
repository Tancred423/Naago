export class ApiRequestFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiRequestFailedError";
  }
}
