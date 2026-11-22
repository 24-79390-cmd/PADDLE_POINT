class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Send a clean JSON error. Unknown errors are logged, not leaked to the client.
function sendError(res, err, fallback = "Something went wrong.") {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error(err);
  return res.status(500).json({ message: fallback });
}

module.exports = { HttpError, sendError };
