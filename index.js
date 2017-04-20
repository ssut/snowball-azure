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

exports.latency = (req, res) => {
  if (req.query.url === undefined || req.query.method === undefined) {
    res.status(400).end();
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
    res.json(sbResp).end();
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
    res.json(errResp).end();
  });
};