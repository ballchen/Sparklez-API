'use strict';

const _ = require('lodash');

const env = process.env.NODE_ENV || 'development';

const config = {
  port: +process.env.SERVER_PORT || 3000,
  host: process.env.SERVER_HOST || '0.0.0.0',
  timezone: process.env.SERVER_TIMEZONE || 'UTC',
  logLevel: process.env.LOG_LEVEL || (env === 'development' ? 'trace' : 'warn'),
  pg: {
    driver: 'pg',
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    port: +process.env.POSTGRES_PORT || 5432
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: +process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.AWS_BUCKET,
    region: process.env.AWS_REGION
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost',
    channels: {
      email: process.env.RABBITMQ_CHANNEL_EMAIL || 'email',
      notification: process.env.RABBITMQ_CHANNEL_NOTIFICATION || 'notification'
    }
  }
};

// Load config file
try {
  _.merge(config, require('./' + env));
} catch (err) {
  console.log('Failed to load config:', env);
}

module.exports = config;
