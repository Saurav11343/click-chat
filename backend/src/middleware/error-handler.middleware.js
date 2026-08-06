export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(`${req.method} ${req.originalUrl}`, error);
  }

  return res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error.",
    ...(error.code ? { code: error.code } : {}),
    ...(error.period ? { period: error.period } : {}),
  });
};

