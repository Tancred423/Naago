export class NotInDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotInDatabaseError";
  }
}
