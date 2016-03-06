'use strict';

const render = require('../common/render');
const ERROR_CODE = require('../common/error').ERROR_CODE;

module.exports = function*(next) {
  if (this.status === 404 && this.body == null) {
    this.status = 404;
    render.call(this, {
      error: ERROR_CODE.notFound,
      message: 'Not found'
    });
  }
};
