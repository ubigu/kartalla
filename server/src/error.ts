/**
 * Generic type for HTTP response error instance objects.
 */
export type HttpResponseError = InstanceType<
  ReturnType<typeof getHttpErrorClass>
>;

/**
 * Creates an error class with given status code.
 * @param statusCode
 */
function getHttpErrorClass<StatusCode extends number>(
  statusCode: StatusCode,
  defaultMessage?: string,
) {
  return class HttpResponseError<InfoType = never> extends Error {
    /**
     * HTTP status code.
     */
    status = statusCode;

    /**
     * HTTP status code for this error type.
     */
    public static STATUS_CODE = statusCode;

    /**
     * Additional info about the error.
     */
    info: InfoType;

    /**
     * Machine-readable error code for client-side translation lookup.
     */
    message_code?: string;

    /**
     * Creates a new error object with a predefined HTTP status code.
     * When Express catches the error, it responds with
     *   - the status code
     *   - error message
     *   - message_code (if provided)
     *   - additional info (if provided)
     * @param message
     * @param info
     * @param message_code
     */
    constructor(
      message = defaultMessage,
      info?: InfoType,
      message_code?: string,
    ) {
      super(message);
      this.info = info;
      this.message_code = message_code;
    }
  };
}

export const BadRequestError = getHttpErrorClass(400 as const);
export const UnauthorizedError = getHttpErrorClass(
  401 as const,
  'Unauthorized',
);
export const ForbiddenError = getHttpErrorClass(403 as const, 'Forbidden');
export const NotFoundError = getHttpErrorClass(404 as const);
export const InternalServerError = getHttpErrorClass(500 as const);
