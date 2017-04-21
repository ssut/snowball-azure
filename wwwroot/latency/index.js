const axios = require('axios');

const newResponse = (error, statusCode, latency) => ({
  error: error,
  status: statusCode,
  latency: latency,
});

const getElapsed = start => {
  const hrTime = process.hrtime(start);
  return Math.floor(hrTime[0] * 1000 + hrTime[1] / 1000000);
};

module.exports = (context, req) => {
  if (req.query.url === undefined || req.query.method === undefined) {
    context.res = {status: 400};
    return context.done();
  }
  const q = {
    url: req.query.url,
    method: req.query.method,
    timeout: req.query.timeout ? parseInt(req.query.timeout) : 10000,
    body: req.query.body,
    headers: req.query.headers ? JSON.parse(req.query.headers) : {},
  };

  const started = process.hrtime();
  axios(q)
  .then(resp => {
    const elapsed = getElapsed(started);
    const statusCode = resp.status;

    const sbResp = newResponse("", statusCode, elapsed);
    context.res = {status: 200, body: sbResp, headers: {'Content-Type': 'application/json'}};
    context.done();
  })
  .catch(err => {
    const elapsed = getElapsed(started);
    let error = "";
    if (err.code === 'ECONNABORTED') {
      error = "TIMEOUT";
    } else {
      error = err.reason;
    }

    const errResp = newResponse(error, -1, elapsed);
    context.res = {status: 200, body: errResp, headers: {'Content-Type': 'application/json'}};
    context.done();
  });
};
