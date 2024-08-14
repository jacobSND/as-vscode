export class ErrorWithOptions extends Error {
  constructor(message: string, public details?: { link: string }) {
    super(message);
  }
}