import { ErrorRequestHandler } from 'express'

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    const statusCode = err.statusCode || 500
    // Не раскрываем внутреннюю информацию о сервере клиенту
    const message =
        statusCode === 500 ? 'На сервере произошла ошибка' : err.message

    // Логируем полную ошибку только на сервере для отладки
    console.error('Error:', statusCode, message)

    res.status(statusCode).send({ message })
}

export default errorHandler
