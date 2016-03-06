'use strict';

const koa = require('koa');

const app = koa();
require('koa-qs')(app);

app.env = process.env.NODE_ENV || 'development';
app.proxy = true;

app.use(require('./routes/middlewares/logger'));

app.use(require('./routes'));

app.on('error', function(err) {
  this.log.error(err);
});

app.use(require('./routes/middlewares/notFound'));

module.exports = app;