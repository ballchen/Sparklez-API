'use strict';

module.exports = function(redis, prefix) {
  return {
    getReadKey(id) {
      return `${prefix}:${id}`;
    },

    isRead(memberId, postId) {
      return redis.sismember(this.getReadKey(postId), memberId).then(Boolean);
    },

    isReadBatch(memberId, posts) {
      let multi = redis.multi();

      for (let postId of posts) {
        multi = multi.sismember(this.getReadKey(postId), memberId);
      }

      return multi.exec().map(item => !!item[1]);
    },

    setRead(memberId, postId, read) {
      if (read == null) read = true;

      if (read) {
        return redis.sadd(this.getReadKey(postId), memberId);
      }

      return redis.srem(this.getReadKey(postId), memberId);
    },

    clearReadLog(postId) {
      return redis.del(this.getReadKey(postId));
    }
  };
};
