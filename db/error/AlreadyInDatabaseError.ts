export class AlreadyInDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlreadyInDatabaseError";
  }
}
