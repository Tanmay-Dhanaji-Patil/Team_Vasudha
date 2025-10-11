// Minimal ambient types for estree to satisfy the TypeScript server during development
// This file is only a small shim. The real @types/estree package is installed, but some TS servers
// still complain in some environments — this local file helps the editor resolve it.

declare namespace ESTree {
  interface Node {
    type: string;
  }
}

declare module 'estree' {
  export = ESTree;
}
