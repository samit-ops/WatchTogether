const ApiError = require('../utils/ApiError');
const httpStatus = require('../constants/httpStatus');

const notFound = (req, res, next) => {
  const error = new ApiError(httpStatus.NOT_FOUND, `Not Found - ${req.originalUrl}`);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode) || 500;
  const message = err.message || 'Internal Server Error';

  res.locals.errorMessage = message;

  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
};

module.exports = {
  notFound,
  errorHandler,
};
