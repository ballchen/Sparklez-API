'use strict';

const router = require('koa-router')();
const render = require('./common/render');
const models = require('../models');

const bodyParser = require('./middlewares/bodyParser');
const authMiddleware = require('./middlewares/auth');
const rateLimit = require('./middlewares/rateLimit');
const cacheControl = require('./middlewares/cacheControl');

// Error recovery
router.use(require('./common/error').middleware);

router.use(cacheControl());
router.use(bodyParser());
router.use(authMiddleware.bearer);

if (process.env.NODE_ENV === 'production') {
  router.use(rateLimit({
    duration: 3600000, // 1 hour
    limit: {
      unauthorized: 100,
      authorized: 5000
    },
    db: models.redis
  }));
}

// router.use('/api', require('./api'));

router.get('/', function*() {
  this.status = 200;

  render.call(this, {
    status: 'ok'
  });
});

const mq = require('../utils/mq');

router.post('/socket', function*() {
  mq.notification({
    type: 'emailSuccess',
    memberId: 131212,
    payload: {
      foo: 'bar',
      bar: 123
    }
  });
  this.status = 200;
});

module.exports = router.routes();
