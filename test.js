var getLogger = require("./index");
var logger = getLogger(module);

logger.silly("127.0.0.1 - there's no place like home");
logger.debug("127.0.0.1 - there's no place like home");
logger.verbose("127.0.0.1 - there's no place like home");
logger.info("127.0.0.1 - there's no place like home");
logger.warn("127.0.0.1 - there's no place like home");
logger.error("127.0.0.1 - there's no place like home");

logger.setMinimalLevel("silly");
logger.silly("127.0.0.1 - there's no place like home");
logger.debug("127.0.0.1 - there's no place like home");
