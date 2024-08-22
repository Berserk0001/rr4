export function bypass(request, reply, buffer) {
  reply.header('x-proxy-bypass', 1);
  reply.header('content-length', buffer.length);
  return reply.code(200).send(buffer);
}
