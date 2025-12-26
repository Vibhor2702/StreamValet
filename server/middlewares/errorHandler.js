function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', err);
  }

  res.status(status).json({ message });
}

module.exports = errorHandler;
