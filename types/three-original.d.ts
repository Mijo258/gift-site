// The bundler alias loads Three.js's original entry point. Its types remain
// those published by @types/three; the adapter implements the same Clock API.
declare module "three-original" {
  export * from "three";
}
