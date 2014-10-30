/// <reference path="typings/tsd.d.ts" />
var _         = require("lodash"),
    pkginfo   = require("pkginfo-json5"),
    utilities = require("mykoop-utils"),
    winston   = require("winston"),
    fs        = require("fs"),
    mkdirp    = require("mkdirp"),
    path      = require("path");

var __DEV__ = utilities.__DEV__;

var defaultLevel = __DEV__ ? "verbose" : "info";
var loggers = {};
var unknownCount = 0;

// Utility to redirect a prototype call to a member implementation.
function proxyMethod(proxyClass, implementationProperty, methodName) {
  proxyClass.prototype[methodName] = function() {
    var implementation = this[implementationProperty];
    implementation[methodName].apply(implementation, arguments);
  };
}

// Utility to get the Date ISO 8601 string, but for the localtime.
// See https://gist.github.com/peterbraden/752376
function localISOString(d: Date, ignoreTimezone: boolean) {
  function pad (n: number): string {
    return n < 10 ? "0" + n : n.toString();
  }

  var timezone = ignoreTimezone ? 0 : d.getTimezoneOffset(), // mins
      timezoneSeconds =
        (timezone > 0 ? "-" : "+") +
        pad(Math.floor(Math.abs(timezone/60)));

    if (timezone % 60 !== 0) {
      timezoneSeconds += pad(Math.abs(timezone % 60));
    }

    if (timezone === 0) {
      // Zulu time == UTC
      timezoneSeconds = ignoreTimezone ? "" : "Z";
    }

    return d.getFullYear() + "-" +
           pad(d.getMonth() + 1 ) + "-" +
           pad(d.getDate()) + "T" +
           pad(d.getHours()) + ":" +
           pad(d.getMinutes()) + ":" +
           pad(d.getSeconds()) + timezoneSeconds;
};

function getNow() {
  var now = new Date();
  var nowISOString;

  if (__DEV__) {
    // ISO-like date, but do as if current timezone was UTC.
    nowISOString = localISOString(now, true);
  } else {
    // Return UTC date and time unless in development.
    nowISOString = now.toISOString();
  }

  return nowISOString.replace(/T/, ' ').replace(/\..+/, '');
}

// Remove default (basic) console logger.
winston.remove(winston.transports.Console);

var bootTimeLabel = getNow().replace(/[ :]/g, '_');
var logDir = path.resolve( process.cwd(), "logs", bootTimeLabel);
console.log(logDir);
if (!fs.existsSync(logDir)) {
  mkdirp.sync(logDir);
}

function LoggerProxy(name: string) {
  this.consoleTransport = new (winston.transports.Console)({
    level: defaultLevel,
    handleExceptions: true,
    prettyPrint: true,
    colorize: true,
    timestamp: getNow,
    label: (name || undefined)
  });
  var logFile = path.resolve(logDir, (name || "winston") + ".log");

  this.fileTransport = new (winston.transports.File)({
    filename: logFile,
    level: "silly",
    prettyPrint: false,
    colorize: true,
    timestamp: getNow,
    label: (name || undefined)
  });

  this.logger = new (winston.Logger)({
    padLevels: true,
    transports: [
      this.consoleTransport,
      this.fileTransport
    ]
  });
}

// Redirect the "log" call and the basic logging levels.
["log"]
  .concat(_.keys(winston.config.npm.levels))
  .forEach(proxyMethod.bind(null, LoggerProxy, "logger"));

// Expose a method to allow the user to change the minimal logging level needed
// to be displayed in the console.
LoggerProxy.prototype.setMinimalLevel = function(level) {
  this.consoleTransport.level = level || defaultLevel;
}

// Provide the appropriate logger each time we're called.
function getLogger(module: string);
function getLogger(module: Object);
function getLogger(module: any) {
  // Label value for the module.
  var name;

  if (typeof module === "string") {
    // If a string, assume it is directly the label.
    name = module;
  } else {
    // Otherwise, try the role field from the package.json(5) and then
    // the name as a last resort.
    var packageInfo = pkginfo(module, "name", "role");

    if (packageInfo.role) {
      name = packageInfo.role;
    } else if (packageInfo.name) {
      name = packageInfo.name;
    } else {
      name = "unknown-" + ++unknownCount;
    }
  }

  // Verify if a logger is already cached for that name.
  if (loggers.hasOwnProperty(name)) {
    return loggers[name];
  }

  // Create transport for that name.
  return loggers[name] = new LoggerProxy(name);
}

export = getLogger;

import test = require("./test");
