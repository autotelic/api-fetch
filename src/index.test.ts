/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { expect } from 'chai';
import { spy } from 'sinon';

import createApiRequest from '.';

describe('createApiRequest', () => {
  it('calls fetch with the correct arguments', async () => {
    const mockFetch = spy(() =>
      Promise.resolve({
        status: 200,
        ok: true,
      }),
    );

    const fetchArgs = [
      'https://google.ca',
      { headers: { 'Content-Type': 'application/json' } },
    ];

    // Arrange
    const apiRequest = createApiRequest(mockFetch);

    // Act
    await apiRequest(...fetchArgs);

    // Assert
    expect(mockFetch.calledOnceWithExactly(...fetchArgs));
  });

  context('Unsuccessful API requests', () => {
    it('Rejects the promise if the status is not OK', async () => {
      const mockFetch = spy(() =>
        Promise.resolve({
          ok: false,
          text: () => 'This request failed',
        }),
      );

      const fetchArgs = ['https://google.ca'];

      // Arrange
      const apiRequest = createApiRequest(mockFetch);

      // Act
      const res = await apiRequest(...fetchArgs);

      // Assert
      expect(res).to.equal('This request failed');
    });
  });

  context('Successful API requests', () => {
    const textResponse = '<div>Response Text</div>';
    const jsonResponse = JSON.stringify({ body: 'some text' });
    const url = 'https://someurl.com';
    const createClientResponse = (responseText, responseHeaders) => () =>
      Promise.resolve({
        ok: true,
        headers: { get: () => responseHeaders },
        json: () => responseText,
        text: () => responseText,
      });

    const tests = [
      {
        desc: 'Returns parsed JSON if the Content-Type is "application/json"',
        fetchArgs: [url],
        expected: JSON.parse(jsonResponse),
        mockClient: createClientResponse(jsonResponse, 'application/json'),
      },
      {
        desc:
          'Returns text when Content-Type is "application/json" but the response is invalid json',
        fetchArgs: [url],
        expected: '',
        mockClient: createClientResponse('', 'application/json'),
      },
      {
        desc: 'Returns text if the Content-Type is not "application/json"',
        fetchArgs: [url],
        expected: textResponse,
        mockClient: createClientResponse(textResponse, 'text/html'),
      },
    ];

    tests.forEach(({ desc, fetchArgs, expected, mockClient }) => {
      it(desc, async () => {
        // Arrange
        const fetchClient = createApiRequest(mockClient);

        // Act
        const actual = await fetchClient(...fetchArgs);

        // Assert
        expect(actual).to.eql(expected);
      });
    });
  });
});
