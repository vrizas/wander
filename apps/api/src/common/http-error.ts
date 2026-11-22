import { STATUS_CODES } from 'node:http';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string | string[],
  ) {
    super(Array.isArray(detail) ? detail.join(', ') : detail);
  }

  toBody() {
    return { statusCode: this.status, message: this.detail, error: STATUS_CODES[this.status] ?? 'Error' };
  }
}

export const badRequest = (m: string | string[]) => new HttpError(400, m);
export const unauthorized = (m: string) => new HttpError(401, m);
export const forbidden = (m: string) => new HttpError(403, m);
export const notFound = (m = 'Not found') => new HttpError(404, m);
export const conflict = (m: string) => new HttpError(409, m);
export const badGateway = (m: string) => new HttpError(502, m);
