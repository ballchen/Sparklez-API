'use strict';

const Promise = require('bluebird');

module.exports = function(options) {
  return Promise.coroutine(function*(instance) {
    const Model = this.sequelize.model(options.modelName);
    const items = yield Model.findAll({
      where: {
        [options.attribute]: instance.get('id')
      },
      attributes: ['id'],
      raw: true
    });

    const ids = items.map(item => item.id);
    yield Model.removeCacheBatch(ids);
  });
};
