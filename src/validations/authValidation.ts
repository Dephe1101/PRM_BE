import Joi from 'joi';

export const authValidation = {
  register: {
    body: Joi.object({
      username: Joi.string().required().min(3).max(50).trim().messages({
        'string.empty': 'Tên người dùng không được để trống',
        'string.min': 'Tên người dùng phải có ít nhất {#limit} ký tự',
        'string.max': 'Tên người dùng không được vượt quá {#limit} ký tự',
        'any.required': 'Tên người dùng là bắt buộc',
      }),
      email: Joi.string().required().email().lowercase().trim().messages({
        'string.empty': 'Email không được để trống',
        'string.email': 'Email không hợp lệ',
        'any.required': 'Email là bắt buộc',
      }),
      password: Joi.string().required().min(6).max(128).messages({
        'string.empty': 'Mật khẩu không được để trống',
        'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự',
        'string.max': 'Mật khẩu không được vượt quá {#limit} ký tự',
        'any.required': 'Mật khẩu là bắt buộc',
      }),
    }),
  },

  login: {
    body: Joi.object({
      email: Joi.string().required().email().lowercase().trim().messages({
        'string.empty': 'Email không được để trống',
        'string.email': 'Email không hợp lệ',
        'any.required': 'Email là bắt buộc',
      }),
      password: Joi.string().required().messages({
        'string.empty': 'Mật khẩu không được để trống',
        'any.required': 'Mật khẩu là bắt buộc',
      }),
    }),
  },
};
