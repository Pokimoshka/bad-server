import { Joi, celebrate } from 'celebrate'
import { Types } from 'mongoose'

// Исправленное регулярное выражение для телефона без вложенных квантификаторов (ReDoS-safe)
export const phoneRegExp = /^\+?\d{1,4}?[\s-()]?\d{1,14}$/

export enum PaymentType {
    Card = 'card',
    Online = 'online',
}

// валидация id
export const validateOrderBody = celebrate({
    body: Joi.object().keys({
        items: Joi.array()
            .items(
                Joi.string().custom((value, helpers) => {
                    if (Types.ObjectId.isValid(value)) {
                        return value
                    }
                    return helpers.message({ custom: 'Невалидный id' })
                })
            )
            .max(100)
            .messages({
                'array.empty': 'Не указаны товары',
                'array.max': 'Слишком много товаров в заказе',
            }),
        payment: Joi.string()
            .valid(...Object.values(PaymentType))
            .required()
            .messages({
                'string.valid':
                    'Указано не валидное значение для способа оплаты, возможные значения - "card", "online"',
                'string.empty': 'Не указан способ оплаты',
            }),
        email: Joi.string().email().required().messages({
            'string.empty': 'Не указан email',
        }),
        phone: Joi.string().required().pattern(phoneRegExp).messages({
            'string.empty': 'Не указан телефон',
        }),
        address: Joi.string().required().max(500).messages({
            'string.empty': 'Не указан адрес',
            'string.max': 'Адрес слишком длинный',
        }),
        total: Joi.number().required().positive().max(1000000).messages({
            'string.empty': 'Не указана сумма заказа',
            'number.positive': 'Сумма заказа должна быть положительной',
            'number.max': 'Сумма заказа слишком большая',
        }),
        comment: Joi.string().optional().allow('').max(1000),
    }),
})

// валидация товара.
export const validateProductBody = celebrate({
    body: Joi.object().keys({
        title: Joi.string().required().min(2).max(30).messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
            'string.empty': 'Поле "title" должно быть заполнено',
        }),
        image: Joi.object().keys({
            fileName: Joi.string().required().max(255),
            originalName: Joi.string().required().max(255),
        }),
        category: Joi.string().required().max(50).messages({
            'string.empty': 'Поле "category" должно быть заполнено',
        }),
        description: Joi.string().required().max(1000).messages({
            'string.empty': 'Поле "description" должно быть заполнено',
        }),
        price: Joi.number().allow(null).min(0).max(1000000),
    }),
})

export const validateProductUpdateBody = celebrate({
    body: Joi.object().keys({
        title: Joi.string().min(2).max(30).messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
        }),
        image: Joi.object().keys({
            fileName: Joi.string().max(255),
            originalName: Joi.string().max(255),
        }),
        category: Joi.string().max(50),
        description: Joi.string().max(1000),
        price: Joi.number().allow(null).min(0).max(1000000),
    }),
})

export const validateObjId = celebrate({
    params: Joi.object().keys({
        productId: Joi.string()
            .required()
            .custom((value, helpers) => {
                if (Types.ObjectId.isValid(value)) {
                    return value
                }
                return helpers.message({ any: 'Невалидный id' })
            }),
    }),
})

export const validateUserBody = celebrate({
    body: Joi.object().keys({
        name: Joi.string().min(2).max(30).messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
        }),
        password: Joi.string().min(6).max(128).required().messages({
            'string.empty': 'Поле "password" должно быть заполнено',
            'string.max': 'Пароль слишком длинный',
        }),
        email: Joi.string()
            .required()
            .email()
            .message('Поле "email" должно быть валидным email-адресом')
            .messages({
                'string.empty': 'Поле "email" должно быть заполнено',
            }),
    }),
})

export const validateAuthentication = celebrate({
    body: Joi.object().keys({
        email: Joi.string()
            .required()
            .email()
            .message('Поле "email" должно быть валидным email-адресом')
            .messages({
                'string.required': 'Поле "email" должно быть заполнено',
            }),
        password: Joi.string().required().messages({
            'string.empty': 'Поле "password" должно быть заполнено',
        }),
    }),
})
