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
import { DB_ADDRESS } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

const { PORT = 3000 } = process.env
const app = express()

// Rate limiting для защиты от DDoS (минимум 10 запросов в минуту)
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 минута
    max: 10, // максимум 10 запросов с одного IP за минуту
    message: 'Слишком много запросов, попробуйте позже',
    standardHeaders: true,
    legacyHeaders: false,
})

app.use(limiter)

// Защитные заголовки HTTP
app.use(
    helmet({
        crossOriginEmbedderPolicy: false,
    })
)

// Санитизация запросов для защиты от NoSQL-инъекций
app.use(mongoSanitize())

app.use(cookieParser())

// CSRF-защита (реализована вручную без устаревшего пакета csurf)
// CSRF-токен генерируется и хранится в куке XSRF-TOKEN.
// Клиент должен отправлять токен в заголовке X-XSRF-TOKEN для
// состояния-изменяющих запросов.
app.use((_req, res, next) => {
    // Генерируем CSRF-токен для каждого ответа
    const csrfToken = crypto.randomBytes(32).toString('hex')
    res.cookie('XSRF-TOKEN', csrfToken, {
        httpOnly: false,
        sameSite: 'lax',
        secure: false,
        path: '/',
    })
    res.setHeader('X-CSRF-Token', csrfToken)
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
