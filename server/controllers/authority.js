const Base = require('./base')
const Token = require('./token')
const UserModel = require('../model/user')
const JWT = require('jsonwebtoken')
const { secret } = require('../config/config')

class Authority extends Base{
  constructor () {
    super()
    this.checkToken = this.checkToken.bind(this)
    this.setToken = this.setToken.bind(this)
    this.getToken = this.getToken.bind(this)
    this.permissions = this.permissions.bind(this)
  }
  // 验证Token令牌
  async checkToken (ctx, next) {
    console.log(ctx.path)
    const whiteList = ['/api/user/login', '/api/user/registered', '/api/user/logOut']
    // 登录和注册,退出不作限制
    // TODO: 暂时不对获取数据的接口验证
    if (whiteList.includes(ctx.path)) {
     return next()
    }
    let token = ctx.header.authorization,
        message = '',
        success = false,
        content = {},
        search
    // token不存在
    if (!token) {
      ctx.body = {
        code: 20201,
        success: false,
        content: {},
        message: '无访问权限'
      }
      next()
      return
    }
    // 验证 Token
    JWT.verify(token, secret, (error, decoded) => {
      if (error) {
        success = false
        message = 'token验证失败'
        return
      }
      success = true
      content = decoded
      message = '验证tonken成功'
    })
    // 验证token格式失败
    if (!success) {
        ctx.body = {
          code: 20201,
          success: false,
          content: {},
          message: '无效的token'
        }
        next()
        return
      }
    try {
      ///search = await this.getToken({[content.type + '_token']: token})
      search = await this.getToken({user_id: content.id})
      console.log("search13")
      console.log(Date.parse(search[content.type + '_expire_time']) < +new Date())
    } catch (e) {
      this.handleException(ctx, e)
      return
    }
    if (!search) {
      ctx.body = {
        code: 20201,
        success: false,
        content: {},
        message: '无访问权限'
      }
      next()
      return
    } else if ( Date.parse(search[content.type + '_expire_time']) < +new Date()) {
      ctx.body = {
        code: 20201,
        success: false,
        content: {},
        message: 'token过期'
      }
      next()
      return
    } else return next()
  }

  // 设置Token令牌
  async setToken (data, obj) {
    let result
    try {
      result = await Token.setToken(data, obj)
    } catch (e) {
      throw e
    }
  }
  // 获取Token令牌
  async getToken (obj) {
    return Token.getToken(obj)
  }
  // 验证用户是否有操作权限
  async permissions (ctx, next) {
    const baseUrl = ctx.baseUrl.split('/')
    const method = ctx.method
    const userInfo = await this.getUserInfo(ctx)
    const whiteList = ['/api/user/login', '/api/user/registered', '/api/user/loginOut']
    let api = ctx.baseUrl + ctx.path
    // 如果是删除接口，将delete后面去掉再校验
    // if (/delete/.test(api)) {
    //   api = api.replace(/\/[^/*]*$/, '')
    // }
    // 当请求方式为get时或者登陆注册时，不需要验证数据权限
    if (method.toLocaleLowerCase() === 'get' || whiteList.includes(api) || whiteList.includes(ctx.originalUrl)) {
      next()
      return
    }
  }
}

module.exports =  new Authority()
module.exports =  new Authority()
