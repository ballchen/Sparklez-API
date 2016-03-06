'use strict';

const moment = require('moment-timezone');
const _ = require('lodash');
const config = require('../config');

function getMidnightTime() {
  return moment()
    .tz(config.timezone)
    .hours(0)
    .minutes(0)
    .seconds(0)
    .millisecond(0);
}

exports.getMidnightTime = getMidnightTime;

function formatBirthday(str) {
  // It seems to be a bug of sequelize that sometimes database returns the raw
  // string instead of a date object
  const date = _.isDate(str) ? str : new Date(str);
  const m = moment(date);

  return m.isValid() ? m.format('YYYYMMDD') : str;
}

exports.formatBirthday = formatBirthday;
