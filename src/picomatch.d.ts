declare module 'picomatch' {
  function picomatch(pattern: string): (input: string) => boolean
  export default picomatch
}
