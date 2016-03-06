'use strict';

const Promise = require('bluebird');
const MemoryCache = require('./MemoryCache');
const _ = require('lodash');

const CACHE_DELIMITER = ':';

function RedisCache(options) {
  MemoryCache.call(this, options);

  if (!options.redis) {
    throw new Error('options.redis is required');
  }

  if (!options.lock) {
    throw new Error('options.lock is required');
  }

  this.redis = options.redis;
  this.cacheTTL = options.cacheTTL || 0;
  this.lock = options.lock;
}

require('util').inherits(RedisCache, MemoryCache);

RedisCache.prototype.getCacheKey = function(id) {
  return this.model.getTableName() + CACHE_DELIMITER + id;
};

RedisCache.prototype.makeCacheData = function(instance) {
  const cacheKey = this.getCacheKey(instance.get('id'));

  return this.prepareCacheData(instance)
    .then(data => _.omit(data, 'id'))
    .then(data => [cacheKey, JSON.stringify(data)]);
};

RedisCache.prototype.getCache = function(id) {
  const cacheId = this.getCacheKey(id);

  return Promise.using(this.lock.disposer('locks:' + cacheId, 1000), lock => {
    return this.redis.get(cacheId).then(cache => {
      if (!cache) return null;

      let data = JSON.parse(cache);
      data.id = id;

      // Cast date string to date object
      if (data.createdAt) data.createdAt = new Date(data.createdAt);
      if (data.updatedAt) data.updatedAt = new Date(data.updatedAt);

      return this.model.build(data, {
        raw: true,
        isNewRecord: false
      });
    });
  });
};

RedisCache.prototype.setCache = Promise.coroutine(function*(instance) {
  const data = yield this.makeCacheData(instance);
  const cacheId = data[0];

  if (this.cacheTTL) {
    yield this.redis.setex(cacheId, this.cacheTTL, data[1]);
  } else {
    yield this.redis.set(cacheId, data[1]);
  }
});

RedisCache.prototype.setCacheBatch = Promise.coroutine(function*(instances) {
  if (!instances.length) return;

  const msetData = Promise.reduce(instances, (result, instance) => {
    return this.makeCacheData(instance).then(data => result.concat(data));
  }, []);

  let multi = this.redis.multi().mset(msetData);

  if (this.cacheTTL) {
    for (let instance of instances) {
      multi = multi.expire(this.getCacheKey(instance.get('id')), this.cacheTTL);
    }
  }

  yield multi.exec();
});

RedisCache.prototype.removeCacheById = function(id) {
  const cacheId = this.getCacheKey(id);

  return this.redis.del(cacheId);
};

RedisCache.prototype.removeCacheBatch = function(ids) {
  if (!ids.length) return Promise.resolve();

  const keys = ids.map(this.getCacheKey.bind(this));

  return this.redis.del(keys);
};

RedisCache.prototype.removeAllCache = Promise.coroutine(function*() {
  const keys = yield this.redis.keys(this.getCacheKey('*'));

  if (keys.length) {
    yield this.redis.del(keys);
  }
});

module.exports = RedisCache;
