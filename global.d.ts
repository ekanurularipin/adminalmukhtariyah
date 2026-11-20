declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}
// src/types/global.d.ts
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}