// Declaring this here because it differs between browser and Node.js
declare function setTimeout(handler: (...args: unknown[]) => void, timeout?: number): void;
