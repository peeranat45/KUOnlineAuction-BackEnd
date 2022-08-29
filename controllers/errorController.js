const AppError = require("../utils/appError")

const handleCaseErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.valie}`
    return new AppError(message, 400)
}

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
    const message = `Duplicate field value : ${value}. Please use a different value`
    return new AppError(message, 400)
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message)
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400)
}

const handelJWTError = () => {
    return new AppError('Invalid token, Please log in again.', 401)
}

const handleJWTExpireError = () => {
    return new AppError('Your token has expired, Please log in again.', 401)
}

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    })
}

const sendErrorProd = (err, res) => {
    if(err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        })
    } else {
        // console.error('ERROR', err)

        res.status(500).json({
            status: "error",
            message: "Somthing went wrong."
        })
    }
}


module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error'

    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(err, res)
    } else if (process.env.NODE_ENV === 'production'){
        let error = err;
        console.log(err.name)
        console.log(err.code)
        if(err.name === 'CastError'){
            error = handleCaseErrorDB(error);
        }
        if(err.code === 11000){
            error = handleDuplicateFieldsDB(error);
        }
        if(err.name === 'ValidationError'){
            error = handleValidationErrorDB(error);
        }
        if(err.name === 'JsonWebTokenError'){
            error = handelJWTError();
        }
        if(err.name === 'TokenExpiredError'){
            error = handleJWTExpireError();
        }
        sendErrorProd(error, res)
    }
  }