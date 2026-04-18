/** Webpack подставляет NODE_ENV при сборке */
declare const process: {
  env: {
    NODE_ENV?: string;
  };
};
