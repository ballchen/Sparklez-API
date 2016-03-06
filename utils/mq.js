'use strict';

const config = require('../config');
const context = require('rabbit.js').createContext(config.rabbitmq.url);
const proto = require('dcard-stream-protocol');

const channels = ['email', 'notification'];
let sockets = {};

for (let key of channels) {
  const channelName = config.rabbitmq.channels[key];
  if (!channelName) throw new TypeError(`channel name for '${key}' is undefined`);

  const socket = context.socket('PUSH', {
    persistent: true
  });

  socket.connect(channelName);
  sockets[key] = socket;
}

exports.notification = function(data) {
  const buf = proto.encodeNotification(data);

  sockets.notification.write(buf);
};

exports.email = function(data) {
  const buf = proto.encodeEmail(data);

  sockets.email.write(buf);
};
