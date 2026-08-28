export function errorHandler(err, req, res, next) {
  console.error('API Error:', err);

  const status = err.status || 500;
  
  // Clean error response, hiding internal passwords or URI info
  const response = {
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred.'
  };

  res.status(status).json(response);
}
