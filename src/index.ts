import { ScaleLinear, scaleLinear } from "d3-scale"

import { line } from "d3-shape"

export type SmokeProbeList = number[]
export type SmokeData = SmokeProbeList[]

export interface SmokechartProps {
  scaleX: ScaleLinear<number, number>
  scaleY: ScaleLinear<number, number>
}

export interface SmokechartArgs {
  mode?: "smoke" | "flame"
  bands?: 0 | 1 | 2 | 3 | 4 | 5 | Array<[number, number]>
  errorRadius?: number
  bandsColor?: string
  lineColor?: string
  lineWidth?: number
}

const quantile = (probes: SmokeProbeList, q: number) => {
  if (q < 0 || q > 1 || isNaN(q)) throw new Error(`Unable to calculate ${q} quantile`)
  var alq = (probes.length - 1) * q
  var idx = Math.floor(alq)
  var diff = alq - idx

  return diff < 0.001 ? probes[idx] : Math.floor(probes[idx] * (1 - diff) + probes[idx + 1] * diff + 0.5)
}

// prettier-ignore
const smokeAreaConfig: Array<Array<[number, number]>> = [
  [],                                           // 0
  [ [0,1] ],                                    // 1
  [ [0,1], [.25,.75] ],                         // 2
  [ [0,1], [.15,.85], [.3,.7] ],                // 3
  [ [0,1], [.1,.9], [.2,.8], [.3,.7] ],         // 4
  [ [0,1], [.1,.9], [.2,.8], [.3,.7], [.4,.6] ] // 5
]

export const calculateSmokeBands = (v: SmokeProbeList, bands: 0 | 1 | 2 | 3 | 4 | 5 | Array<[number, number]>) => {
  const bandKind = Array.isArray(bands) ? bands : smokeAreaConfig[bands]
  return bandKind.map(([from, to]) => [quantile(v, from), quantile(v, to)] as [number, number])
}

// prettier-ignore
const flameAreaConfig = [
  [],                       // 0
  [ .5 ],                   // 1
  [ .5, .75 ],              // 2
  [ .5, .7, .9 ],           // 3
  [ .4, .55, .7, .85 ],     // 4
  [ .5, .6, .7, .8, .9 ]    // 5
]

/**
 * SmokeChart returns class responsible for building Smoke viz.
 *
 *
 */
export const Smokechart = (smokeData?: SmokeData | Partial<SmokechartProps>, opts?: Partial<SmokechartProps>) => {
  const props: SmokechartProps = {
    scaleX: scaleLinear(),
    scaleY: scaleLinear(),
  }
  let data: SmokeData = []
  let errs: Array<{ errors: number; count: number }> = []
  let classSuffix = Math.floor(Math.random() * 100000)

  const smoke = (smokeData?: SmokeData | Partial<SmokechartProps>, opts?: Partial<SmokechartProps>) => {
    if (smokeData && !Array.isArray(smokeData)) {
      opts = smokeData
      smokeData = undefined
    }
    if (opts) Object.assign(props, opts)
    if (smokeData) smoke.data(smokeData)

    classSuffix = Math.floor(Math.random() * 100000)
    return smoke
  }

  /**
   * obj.data() initializes smokechart's matrix of probes, returning chainable object or returns current data if arg was omitted
   */
  smoke.data = (smokeData?: SmokeData) => {
    if (smokeData) {
      // clone data while sorting each row
      data = smokeData.map(arr => [...arr.filter(n => !isNaN(n))].sort((a, b) => a - b))
      errs = smokeData.map(arr => {
        return {
          errors: [...arr.filter(n => isNaN(n))].length,
          count: arr.length,
        }
      })
      return smoke
    }
    return data
  }

  /**
   * obj.adjustScaleRange() fixes X/Y scale input ranges to fit chart properly, useful to call when data changed
   */
  smoke.adjustScaleRange = () => {
    if (props.scaleX) props.scaleX.domain([0, data.length])
    if (!props.scaleY) return
    let minY = Infinity
    let maxY = -Infinity
    data.forEach(arr => {
      if (arr.length) {
        if (arr[0] < minY) minY = arr[0]
        if (arr[arr.length - 1] > maxY) maxY = arr[arr.length - 1]
      }
    })
    props.scaleY.domain([minY, maxY])
    return smoke // allow chaining by returning original
  }

  /**
   * obj.scaleX() and obj.scaleY() are getter/settters for smokechart prop elements
   */
  smoke.scaleX = (newScale?: ScaleLinear<number, number>) => {
    if (newScale) {
      props.scaleX = newScale
      return smoke
    }
    return props.scaleX
  }
  smoke.scaleY = (newScale?: ScaleLinear<number, number>) => {
    if (newScale) {
      props.scaleY = newScale
      return smoke
    }
    return props.scaleY
  }

  /**
   * obj().line(quantile) returns quantile-dictated line for drawing in the chart's context
   * quantile could be any number 0 to 1, defaults to "median", 0.5
   */
  smoke.line = (q: number = 0.5) => {
    const l = line<[number, number]>()
      .x(d => props.scaleX(d[0]))
      .y(d => props.scaleY(d[1]))

    const quantileData = data.reduce<Array<[number, number]>>((reslt, values, idx) => {
      const p = quantile(values, q)
      return [...reslt, [idx - 0.5, p], [idx + 0.5, p]]
    }, [])

    return [l(quantileData)]
  }

  /** obj().smokeBands(N) returns array of shapes to draw as "smoke bands" */
  smoke.smokeBands = (bCount: 1 | 2 | 3 | 4 | 5 | Array<[number, number]> = 2) => {
    const l = line<[number, number]>()
      .x(d => props.scaleX(d[0]))
      .y(d => props.scaleY(d[1]))

    const bands = data.reduce<string[][]>((reslt, values, idx) => {
      const bandData = calculateSmokeBands(values, bCount)
      const x = idx - 0.5
      const bandLines = bandData.map(
        ([y0, y1]) =>
          l([
            [x, y0],
            [x, y1],
            [x + 1, y1],
            [x + 1, y0],
          ]) || ""
      )
      return [...reslt, bandLines]
    }, [] as string[][])

    // each set contains lines for same X value but we best to join
    // lines for same color (bands is matrix of [rowIdx][columnIdx])
    return bands[0].map((_, columnIdx) => bands.map(row => row[columnIdx]).join(""))
  }

  /**
   * obj.countErrors() returns number of probes NaN in each probe
   */
  smoke.countErrors = () => {
    return errs.map(v => v.errors)
  }

  /** obj.smokechart renders fully functional chart */
  smoke.chart = (selection: any, args?: SmokechartArgs) => {
    if (args?.bands) {
      selection
        .selectAll("path.smokechart-band" + classSuffix)
        .data(smoke.smokeBands(args?.bands))
        .enter()
        .append("path")
        .classed("smokechart-band", true)
        .attr("fill", args?.bandsColor || "rgba(0,0,0,0.18)")
        .attr("d", (d: string) => d)
    }

    selection
      .selectAll("path.smokechart-line" + classSuffix)
      .data(smoke.line(0.5))
      .enter()
      .append("path")
      .classed("smokechart-line", true)
      .attr("shape-rendering", "crispEdges")
      .attr("stroke", args?.lineColor || "#ff0000")
      .attr("stroke-width", args?.lineWidth || 2)
      .attr("fill", "transparent")
      .attr("d", (d: string) => d)

    const eRadius = args?.errorRadius || 0
    if (eRadius > 0) {
      const paths = errs.map(({ errors, count }, pos) => {
        if (errors > 0 && count > 0) {
          const xPos = props.scaleX(pos)
          const alpha = (Math.PI * 2 * errors) / count
          const endX = eRadius * Math.sin(alpha) + xPos
          const endY = eRadius * Math.cos(alpha + Math.PI) + 1 + eRadius
          return `M ${xPos},${eRadius + 1} v-${eRadius} A ${eRadius},${eRadius} 0,0,1 ${endX},${endY} Z`
        }
      })

      selection
        .selectAll("path.smokechart-errs")
        .data([paths.join(" ")])
        .enter()
        .append("path")
        .attr("fill", "#f30")
        .attr("d", (d: string) => d)
    }
  }

  return smoke(smokeData, opts)
}
