import { onRequest } from 'firebase-functions/v2/https';

export const healthCheck = onRequest((_request, response) => {
  if (_request.method !== 'GET') {
    response.set('Allow', 'GET');
    response.status(405).json({ status: 'method_not_allowed' });
    return;
  }

  response.status(200).json({ status: 'ok' });
});