export class MaximumAmountReachedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MaximumAmountReachedError";
  }
}
