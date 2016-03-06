'use strict';

module.exports = {
  'host': '0.0.0.0',
  'post': '3000',
  'pg': {
    'driver': 'pg',
    'database': 'xiao_api_dev',
    'user': 'ball',
    'password': '',
    'host': '127.0.0.1',
    'multipleStatements': true
  },
  'redis': {
    'host': '127.0.0.1',
    'port': 6379,
    'password': ''
  },
  'AWS': {
    'bucket': 'dcarddcard',
    'region': 's3-ap-northeast-1',
    'accessKeyId': 'AKIAJOEPUWAIUIKM6TXA',
    'secretAccessKey': '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'
  }
}