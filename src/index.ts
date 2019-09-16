import fetch from 'cross-fetch';
import startsWith from 'lodash.startswith';

type FetchClient = (
  input: RequestInfo,
  init?: RequestInit | undefined,
) => Promise<Response>;

async function checkResponseIsOk(response: Response): Promise<Response> {
  if (response.ok) {
    return response;
  }
  const error = await response.text();
  return Promise.reject(error);
}

async function responseToCompletion(
  response: Response,
): Promise<string | object> {
  const contentType = response.headers.get('Content-Type');
  if (contentType && startsWith(contentType, 'application/json')) {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  }
  return response.text();
}

const createApiRequest = (fetchClient: FetchClient = fetch) => (
  // Merge fetch args
  // apply middleware,
  // make the call
  fetchArgs: Request,
): Promise<string | object | Error> =>
  fetchClient(fetchArgs)
    .then(checkResponseIsOk)
    .then(responseToCompletion)
    .catch((error: Promise<Error>) => error);

export default createApiRequest;
