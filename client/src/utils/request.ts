/**
 * Fetch TS typings only allow string values in body -
 * override it with unknown value (JSON serialization is done in the wrapper anyway)
 */
interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/**
 * Serializes request body. Returns the serialized data and the Content-Type header value.
 * @param body
 */
function serializeBody(body: unknown): {
  data: ArrayBuffer | string;
  type: 'application/json' | 'application/octet-stream';
} {
  // ArrayBuffer - leave the binary data as is, send it as octet stream
  if (body instanceof ArrayBuffer) {
    return {
      data: body,
      type: 'application/octet-stream',
    };
  }
  // Default - serialize body as JSON
  return {
    data: JSON.stringify(body),
    type: 'application/json',
  };
}

/**
 * Request wrapper for handling JSON data.
 * Accepts unknown values for the request body.
 * Body is serialized as JSON, unless it is of type ArrayBuffer - in this case the data is sent as is.
 * Throws an error if the server responds with an error.
 * @param url Request URL
 * @param options Request options
 */
export async function request<Response = unknown>(
  url: string,
  options?: RequestOptions,
) {
  const body = options?.body ? serializeBody(options.body) : undefined;
  const response = await fetch(url, {
    ...(options || {}),
    body: body?.data ?? undefined,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': body.type } : {}),
      ...(options?.headers ?? {}),
    },
  });
  if (!response.ok) {
    // Extract the response as text first - the stream can only be read once
    let error: string | object = await response.text();
    try {
      // Try to parse the error as JSON
      error = JSON.parse(error);
    } catch (error) {
      // Could not parse the error as JSON - fail silently
    }
    throw {
      // If the error is an object, spread it to the return value
      ...(typeof error === 'object'
        ? error
        : {
            // Otherwise, add it under the 'text' key
            text: error,
          }),
      // Always add error status code to the error
      status: response.status,
    };
  }

  // In case of JSON parse error, fail silently - e.g. empty responses might cause this
  return (await response.json().catch((): null => null)) as Response;
}
