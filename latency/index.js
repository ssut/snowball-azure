"use strict";
const httpstat = require('httpstat');

const defaultHeaders = {
  'Content-Type': 'application/json',
};

const newResponse = (error, statusCode, bodySize, latency) => ({
  error: error,
  status: statusCode,
  body: bodySize,
  latency: latency,
});

module.exports = (context, req) => {
  if (req.query.url === undefined || req.query.method === undefined) {
    context.res = {status: 400};
    return context.done();
  }
  const url = req.query.url;
  const body = req.query.body;
  const q = {
    method: req.query.method,
    timeout: req.query.timeout ? parseInt(req.query.timeout) : 10000,
    headers: req.query.headers ? JSON.parse(req.query.headers) : {},
  };

  let timeout = setTimeout(() => {
    timeout = null;
    context.res = {status: 200, body: newResponse("TIMEOUT", -1, -1, {}), headers: defaultHeaders};
    contxt.done();
  }, 1 + q.timeout);

  httpstat(url, q, body).then(result => {
    if (timeout === null) return;
    clearTimeout(timeout);
    const statusCode = result.response.statusCode;
    const bodySize = result.response.body.length;
    const proto = result.url.protocol;
    const time = result.time;
    const latency = {
      dns: time.onLookup - time.begin,
      tcp: time.onConnect - time.onLookup,
      tls: time.onSecureConnect - time.onConnect,
      server: time.onTransfer - (proto === 'https:' ? time.onSecureConnect : time.onConnect),
      transfer: time.onTotal - time.onTransfer,
    };
    if (proto === 'http:') {
      delete latency.tls;
    }

    context.res = {status: 200, body: newResponse("", statusCode, bodySize, latency), headers: defaultHeaders};
    context.done();
  }).catch(e => {
    if (timeout === null) return;
    clearTimeout(timeout);
    console.error(e);
    context.res = {status: 200, body: newResponse(e.toString(), -1, -1, {}), headers: defaultHeaders};
    context.done();
  })
};
