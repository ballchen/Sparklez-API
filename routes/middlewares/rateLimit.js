'use strict';

const Promise = require('bluebird');
const Limiter = require('ratelimiter');
const validator = require('validator');
const render = require('../common/render');
const ERROR_CODE = require('../common/error').ERROR_CODE;

Limiter.prototype.getAsync = Promise.promisify(Limiter.prototype.get);

function getRequestIP(ctx) {
  const ip = ctx.get('X-Client-IP');
  if (validator.isIP(ip)) return ip;
}

module.exports = function(options) {
  return function*(next) {
    const token = this.state.token;
    let id = this.request.ip;

    if (token) {
      const ip = getRequestIP(this);
      id = ip || token.get('id');
    }

    const limiter = new Limiter({
      id,
      db: options.db,
      duration: options.duration,
      max: token ? options.limit.authorized : options.limit.unauthorized
    });
    const limit = yield limiter.getAsync();
    const remaining = limit.remaining > 0 ? limit.remaining - 1 : 0;

    this.set('X-RateLimit-Limit', limit.total);
    this.set('X-RateLimit-Remaining', remaining);
    this.set('X-RateLimit-Reset', limit.reset);

    if (!limit.remaining) {
      this.status = 429;
      return render.call(this, {
        error: ERROR_CODE.rateLimitExceeded,
        message: 'Rate limit exceeded'
      });
    }

    yield next;
  };
};
