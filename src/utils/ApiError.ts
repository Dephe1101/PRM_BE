interface ErrorCodeEntry {
  statusCode: number;
  code: string;
  message: string;
}

export class ApiError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(errorCode: ErrorCodeEntry, overrideMessage?: string) {
    super(overrideMessage || errorCode.message);
    this.statusCode = errorCode.statusCode;
    this.code = errorCode.code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
