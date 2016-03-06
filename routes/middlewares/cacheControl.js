'use strict';

// Set default Cache-Control header
module.exports = function() {
  return function*(next) {
    this.set('Cache-Control', 'private');
    yield next;
  };
};
