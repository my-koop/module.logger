
declare module mklogger {
  export interface Logger {
    silly: (...args: any[]) => void;
    debug: (...args: any[]) => void;
    verbose: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    log: (type: string, ...args: any[]) => void;

    setMinimalLevel: (type: string) => void;
  }
}

declare module "mykoop-logger" {
  function getLogger(module: any): mklogger.Logger;

  export = getLogger;
}
