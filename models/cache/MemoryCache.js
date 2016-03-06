'use strict';

const Promise = require('bluebird');
const Sequelize = require('sequelize');

function defaultPrepareCache(instance) {
  const attrs = instance.Model.attributes;
  const data = instance.get({plain: true});
  let result = {};

  Object.keys(data).forEach(key => {
    const attr = attrs[key];
    if (!attr || attr.type instanceof Sequelize.VIRTUAL) return;

    result[key] = data[key];
  });

  return result;
}

function MemoryCache(options) {
  options = options || {};

  if (!options.model) {
    throw new Error('options.model is required');
  }

  if (options.select && !Array.isArray(options.select)) {
    throw new TypeError('options.select must be an array');
  }

  this.model = options.model;
  this.select = options.select || [];
  this.cache = {};
  this.binded = false;
  this.prepareCache = Promise.method(options.prepareCache || defaultPrepareCache);

  if (this.select && this.select.length && !~this.select.indexOf('id')) {
    this.select.push('id');
  }
}

MemoryCache.prototype.setModel = function(model) {
  this.model = model;
};

MemoryCache.prototype.getCacheKey = function(id) {
  return id;
};

MemoryCache.prototype.getCache = function(id) {
  const cacheId = this.getCacheKey(id);
  const cache = this.cache[cacheId];
  if (!cache) return Promise.resolve();

  return Promise.resolve(this.model.build(cache, {
    raw: true,
    isNewRecord: false
  }));
};

MemoryCache.prototype.prepareCacheData = function(instance) {
  return this.prepareCache(instance);
};

MemoryCache.prototype.setCache = function(instance) {
  const cacheId = this.getCacheKey(instance.get('id'));

  return this.prepareCacheData(instance).then(data => {
    this.cache[cacheId] = data;
  });
};

MemoryCache.prototype.setCacheBatch = function(instances) {
  return Promise.map(instances, this.setCache.bind(this));
};

MemoryCache.prototype.removeCacheById = function(id) {
  const cacheId = this.getCacheKey(id);

  this.cache[cacheId] = null;
  return Promise.resolve();
};

MemoryCache.prototype.removeCacheBatch = function(ids) {
  return Promise.map(ids, id => this.removeCacheById(id));
};

MemoryCache.prototype.findCacheById = Promise.coroutine(function*(id) {
  let cache = yield this.getCache(id);
  if (cache) return cache;

  let options = {
    where: {id}
  };

  if (this.select && this.select.length) {
    options.attributes = this.select;
  }

  let instance = yield this.model.findOne(options);
  if (!instance) return;

  yield this.setCache(instance);

  return instance;
});

MemoryCache.prototype.findCacheBatch = Promise.coroutine(function*(ids) {
  let store = {};
  let unhitIds = [];
  let result = [];

  // Find cache in redis
  for (let id of ids) {
    let cache = yield this.getCache(id);

    if (cache) {
      store[id] = cache;
      continue;
    }

    // Push unhit ids
    unhitIds.push(id);
  }

  if (unhitIds.length) {
    let options = {
      where: {
        id: {$in: unhitIds}
      }
    };

    if (this.select && this.select.length) {
      options.attributes = this.select;
    }

    // Find data in SQL
    let instances = yield this.model.findAll(options);

    if (instances.length) {
      for (let item of instances) {
        store[item.get('id')] = item;
      }

      // Save cache
      if (instances.length > 1) {
        yield this.setCacheBatch(instances);
      } else {
        yield this.setCache(instances[0]);
      }
    }
  }

  for (let id of ids) {
    result.push(store[id]);
  }

  return result;
});

MemoryCache.prototype.removeAllCache = function() {
  this.cache = {};
  return Promise.resolve();
};

MemoryCache.prototype.afterSaveHook = function(instance) {
  return this.setCache(instance);
};

MemoryCache.prototype.beforeDestroyHook = function(instance) {
  return this.removeCacheById(instance.get('id'));
};

MemoryCache.prototype.bind = function() {
  // Do nothing if hooks has been binded
  if (this.binded) return;

  this.binded = true;
  const model = this.model;

  const afterSaveHook = this.afterSaveHook.bind(this);
  const beforeDestroyHook = this.beforeDestroyHook.bind(this);

  // Bind class methods
  model.getCache = this.getCache.bind(this);
  model.findCacheById = this.findCacheById.bind(this);
  model.findCacheBatch = this.findCacheBatch.bind(this);
  model.removeCacheById = this.removeCacheById.bind(this);
  model.removeCacheBatch = this.removeCacheBatch.bind(this);
  model.removeAllCache = this.removeAllCache.bind(this);
  model.unbindCache = this.unbind.bind(this);

  // Bind hooks
  model.addHook('afterCreate', 'MemoryCache:afterCreate', afterSaveHook);
  model.addHook('afterUpdate', 'MemoryCache:afterUpdate', afterSaveHook);
  model.addHook('beforeDestroy', 'MemoryCache:beforeDestroy', beforeDestroyHook);
};

MemoryCache.prototype.unbind = function() {
  // Do nothing if hooks has not been binded
  if (!this.binded) return;

  this.binded = false;
  const model = this.model;

  // Unbind class methods
  model.getCache = null;
  model.findCacheById = null;
  model.findCacheBatch = null;
  model.removeCacheById = null;
  model.removeCacheBatch = null;
  model.removeAllCache = null;
  model.unbindCache = null;

  // Unbind hooks
  model.removeHook('afterCreate', 'MemoryCache:afterCreate');
  model.removeHook('afterUpdate', 'MemoryCache:afterUpdate');
  model.removeHook('beforeDestroy', 'MemoryCache:beforeDestroy');
};

module.exports = MemoryCache;
