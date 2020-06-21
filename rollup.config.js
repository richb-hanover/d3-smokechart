import * as meta from "./package.json"

import { terser } from "rollup-plugin-terser"

const name = "d3"
const globals = Object.assign(
  {},
  ...Object.keys(meta.dependencies || {})
    .filter(key => /^d3-/.test(key))
    .map(key => ({ [key]: "d3" }))
)

const umd = (file, plugins) => ({ name, file, plugins, globals, sourcemap: true, format: "umd", extend: true })

export default {
  input: "dist/index.js",
  external: Object.keys(meta.dependencies || {}).filter(key => /^d3-/.test(key)),
  output: [umd("umd/d3-smokechart.js", []), umd("umd/d3-smokechart.min.js", [terser()])],
}
