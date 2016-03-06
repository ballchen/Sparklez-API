'use strict';

module.exports = {
  host: '0.0.0.0',
  port: 3000,
  timezone: 'UTC',
  logLevel: 'warn',
  pg: {
    driver: 'pg',
    database: 'xiao_api_dev',
    user: 'dcard',
    password: 'dcard',
    host: '127.0.0.1'
  },
  redis: {
    host: '127.0.0.1',
    port: 6379,
    password: ''
  },
  aws: {
    accessKeyId: 'ACCESS_KEY_ID',
    secretAccessKey: 'SECRET_ACCESS_KEY',
    bucket: 'bucket',
    region: 'REGION'
  }
};
