import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import crypto from 'crypto'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import path from 'path'
import { DB_ADDRESS, RATE_LIMIT } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

const { PORT = 3000 } = process.env
const app = express()

// Rate limiting для защиты от DDoS
// Настройки берутся из переменных окружения (RATE_LIMIT_POINTS, RATE_LIMIT_DURATION)
const limiter = rateLimit({
    windowMs: RATE_LIMIT.duration * 1000, // окно в миллисекундах
    max: RATE_LIMIT.points, // максимум запросов за окно
    message: 'Слишком много запросов, попробуйте позже',
    standardHeaders: true,
    legacyHeaders: false,
})

if (RATE_LIMIT.enabled) {
    app.use(limiter)
}

// Защитные заголовки HTTP
app.use(
    helmet({
        crossOriginEmbedderPolicy: false,
    })
)

app.use(cookieParser())

// CSRF-защита (double-submit cookie паттерн)
// CSRF-токен хранится в куке _csrf и валидируется на сервере
app.use((req, res, next) => {
    // Переиспользуем существующий токен из куки, иначе генерируем новый
    const csrfToken =
        req.cookies._csrf || crypto.randomBytes(32).toString('hex')
    res.cookie('_csrf', csrfToken, {
        httpOnly: false,
        sameSite: 'lax',
        secure: false,
        path: '/',
    })
    res.locals.csrfToken = csrfToken
    next()
})

// CORS с ограничением Origins
app.use(
    cors({
        origin: process.env.ORIGIN_ALLOW || 'http://localhost:5173',
        credentials: true,
    })
)

app.options('*', cors())

app.use(serveStatic(path.join(__dirname, 'public')))

// Ограничение размера тела запроса для защиты от переполнения буфера
app.use(urlencoded({ extended: true, limit: '10kb' }))
app.use(json({ limit: '10kb' }))

// Санитизация запросов для защиты от NoSQL-инъекций
app.use(mongoSanitize())

// CSRF-валидация для estado-изменяющих запросов
app.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const cookieToken = req.cookies._csrf
        const token =
            (req.body && req.body._csrf) ||
            (req.query && req.query._csrf) ||
            req.get('csrf-token') ||
            req.get('xsrf-token') ||
            req.get('x-csrf-token') ||
            req.get('x-xsrf-token')

        if (!cookieToken || !token || cookieToken !== token) {
            return res.status(403).json({ message: 'Невалидный CSRF-токен' })
        }
    }
    return next()
})

app.use(routes)
app.use(errors())
app.use(errorHandler)

// eslint-disable-next-line no-console

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log('ok'))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()
