export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (what: string): AppError => new AppError(404, 'not_found', `${what} not found`);
export const badRequest = (message: string): AppError => new AppError(400, 'bad_request', message);
export const conflict = (message: string): AppError => new AppError(409, 'conflict', message);
export const unauthorized = (): AppError => new AppError(401, 'unauthorized', 'Host PIN required');
