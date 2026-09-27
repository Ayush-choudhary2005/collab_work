// Wraps an async route/middleware handler so rejected promises are
// forwarded to Express's error-handling middleware instead of crashing
// the process or requiring a try/catch in every controller.
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
