import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

export default function serveStatic(baseDir: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Предотвращаем path traversal: разрешаем только файлы внутри baseDir
        const requestedPath = path.join(baseDir, req.path)
        const resolvedBaseDir = path.resolve(baseDir)
        const resolvedFilePath = path.resolve(requestedPath)

        // Проверяем, что запрашиваемый файл находится внутри базовой директории
        if (!resolvedFilePath.startsWith(resolvedBaseDir + path.sep) && resolvedFilePath !== resolvedBaseDir) {
            return next()
        }

        // Проверяем, существует ли файл
        fs.access(resolvedFilePath, fs.constants.F_OK, (err) => {
            if (err) {
                // Файл не существует, отдаем дальше мидлварам
                return next()
            }
            // Файл существует, отправляем его клиенту
            return res.sendFile(resolvedFilePath, (sendErr) => {
                if (sendErr) {
                    next(sendErr)
                }
            })
        })
    }
}
