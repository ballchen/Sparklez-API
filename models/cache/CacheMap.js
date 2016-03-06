'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

function CacheMap(model, key) {
  this.model = model;
  this.key = key;
  this.map = {};
  this.binded = false;
}

CacheMap.prototype.findByKey = Promise.coroutine(function*(value) {
  if (this.map.hasOwnProperty(value)) {
    const id = this.map[value];

    // Do nothing if map value is null
    if (!id) return;

    // Find in model with id
    if (this.model.findCacheById) {
      return this.model.findCacheById(id);
    }

    return this.model.findById(id);
  }

  let condition = {};
  condition[this.key] = value;

  let instance = yield this.model.findOne({
    where: condition
  });

  // If it can't find data for the key. Set map value to null
  // to prevent future queries.
  if (!instance) {
    this.map[value] = null;
    return;
  }

  // Set id in map
  this.map[value] = instance.get('id');

  return instance;
});

CacheMap.prototype.afterCreateHook = function(instance) {
  this.map[instance.get(this.key)] = instance.get('id');
};

CacheMap.prototype.afterUpdateHook = function(instance) {
  if (!instance.changed(this.key)) return;

  delete this.map[instance.previous(this.key)];
  this.map[instance.get(this.key)] = instance.get('id');
};

CacheMap.prototype.beforeDestroyHook = function(instance) {
  delete this.map[instance.get(this.key)];
};

CacheMap.prototype.bind = function() {
  // Do nothing if hooks has been binded
  if (this.binded) return;

  this.binded = true;
  const model = this.model;

  // Bind class methods
  model['findBy' + _.capitalize(this.key)] = this.findByKey.bind(this);
  model.unbindCacheMap = this.unbind.bind(this);

  // Bind hooks
  model.addHook('afterCreate', 'CacheMap:afterCreate', this.afterCreateHook.bind(this));
  model.addHook('afterUpdate', 'CacheMap:afterUpdate', this.afterUpdateHook.bind(this));
  model.addHook('beforeDestroy', 'CacheMap:beforeDestroy', this.beforeDestroyHook.bind(this));
};

CacheMap.prototype.unbind = function() {
  // Do nothing if hooks has not been binded
  if (!this.binded) return;

  this.binded = false;
  const model = this.model;

  // Unbind class methods
  model['findBy' + _.capitalize(this.key)] = null;
  model.unbindCacheMap = null;

  // Unbind hooks
  model.removeHook('afterCreate', 'CacheMap:afterCreate');
  model.removeHook('afterUpdate', 'CacheMap:afterUpdate');
  model.removeHook('beforeDestroy', 'CacheMap:beforeDestroy');
};

module.exports = CacheMap;
