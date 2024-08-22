export function redirect(request, reply) {
  if (reply.sent) {
    return;
  }

  reply
    .header('content-length', 0)
    .removeHeader('cache-control')
    .removeHeader('expires')
    .removeHeader('date')
    .removeHeader('etag')
    .header('location', encodeURI(request.params.url))
    .code(302)
    .send();
}
