import * as meta from "./package.json"

import { terser } from "rollup-plugin-terser"
import nodeResolve from "@rollup/plugin-node-resolve";

const name = "d3"
const globals = Object.assign(
  {},
  ...Object.keys(meta.dependencies || {})
    .filter(key => /^d3-/.test(key))
    .map(key => ({ [key]: "d3" }))
)

// https://github.com/d3/d3-interpolate/issues/58
const D3_WARNING = /Circular dependency.*d3-interpolate/

const umd = (file, plugins) => ({ name, file, plugins, globals, sourcemap: true, format: "umd", extend: true })

export default [
  {
    input: "dist/index.js",
    external: Object.keys(meta.dependencies || {}).filter(key => /^d3-/.test(key)),
    output: [umd("umd/d3-smokechart.js",[]), umd("umd/d3-smokechart.min.js", [terser()])],
  },
  {
    input: "dist/smokechart.js",
    output: [
      {
        name: "Smokechart",
        file: "umd/smokechart.js",
        sourcemap: true,
        format: "umd",
        extend: true
      },
      {
        name: "Smokechart",
        file: "umd/smokechart.min.js",
        sourcemap: true,
        format: "umd",
        extend: true,
        plugins: [terser()]
      }
    ],
    plugins: [nodeResolve()],

// and https://github.com/d3/d3-interpolate/issues/58 here, too
    onwarn: function ( message ) {
      if ( D3_WARNING.test(message) ) {
        return
      }
    },
  }
]
