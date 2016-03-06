'use strict';

const _ = require('lodash');

exports.instanceMethods = {
  hasScope(scope) {
    return Boolean(~this.get('scopes').indexOf(scope));
  },

  addScope(scope) {
    if (this.hasScope(scope)) return Promise.resolve();

    return this.update({
      scopes: this.get('scopes').concat(scope)
    });
  },

  addScopes(scopes) {
    let newScopes = _.difference(scopes, this.get('scopes'));
    if (!newScopes.length) {
      return Promise.resolve();
    }

    return this.update({
      scopes: this.get('scopes').concat(newScopes)
    });
  },

  removeScope(scope) {
    if (!this.hasScope(scope)) return Promise.resolve();

    return this.update({
      scopes: _.without(this.get('scopes'), scope)
    });
  },

  removeScopes(scopes) {
    return this.update({
      scopes: _.difference(this.get('scopes'), scopes)
    });
  },

  isScopeExceeded(scopes) {
    for (let scope of scopes) {
      if (!this.hasScope(scope)) return true;
    }

    return false;
  }
};
