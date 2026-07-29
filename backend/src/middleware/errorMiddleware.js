const ApiError = require('../utils/ApiError');
const httpStatus = require('../constants/httpStatus');

const notFound = (req, res, next) => {
  const error = new ApiError(httpStatus.NOT_FOUND, `Not Found - ${req.originalUrl}`);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  
  if (!err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = 'Internal Server Error';
  }

  res.locals.errorMessage = err.message;

  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode || 500).json(response);
};

module.exports = {
  notFound,
  errorHandler,
};
