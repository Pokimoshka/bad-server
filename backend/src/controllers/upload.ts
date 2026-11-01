import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import BadRequestError from '../errors/bad-request-error'

const MIN_FILE_SIZE = 2048 // 2 КБ
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 МБ

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }
    // Проверка минимального размера файла
    if (req.file.size < MIN_FILE_SIZE) {
        return next(
            new BadRequestError('Файл слишком छोटый. Минимальный размер - 2 КБ')
        )
    }
    // Проверка максимального размера файла
    if (req.file.size > MAX_FILE_SIZE) {
        return next(
            new BadRequestError('Файл слишком большой. Максимальный размер - 10 МБ')
        )
    }
    try {
        // Используем только имя файла (без путей) для предотвращения path traversal
        const fileName = process.env.UPLOAD_PATH
            ? `/${process.env.UPLOAD_PATH}/${req.file.filename}`
            : `/${req.file?.filename}`
        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName: req.file?.originalname,
        })
    } catch (error) {
        return next(error)
    }
}

export default {}
