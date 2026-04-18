/** Webpack подставляет NODE_ENV при сборке */
declare const process: {
  env: {
    NODE_ENV?: string;
  };
};

/** CSS-модули (side-effect imports) */
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
