/**
 * Wrap an async Express handler to forward errors to centralized middleware.
 * @param {Function} fn - Async route handler.
 * @returns {Function} Wrapped handler.
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
