import { ScaleLinear, scaleLinear } from "d3-scale"
import { line } from "d3-shape"

export type HourSamples = number[]      // array of "data samples" measured during an hour
export type SmokeData = HourSamples[]   // multiple hour's worth of data

export interface SmokechartProps {
  scaleX: ScaleLinear<number, number>
  scaleY: ScaleLinear<number, number>
  percentiles: (number[])[],
  // smokeColor: string;
  smokeOpacity: number[];
  // medianColor: string;
  // errorColor: string
  // numStripes: number;
}

export interface SmokechartArgs {
  mode?: "smoke" | "flame"
  bands?: 0 | 1 | 2 | 3 | 4 | 5
  errors?: boolean
}

/**
 * quantile() - given a (sorted) array of samples, return the value at the q'th percentile
 * @param samples - array of numeric values
 * @param q - a float between (0 and 1)
 * @return sample at the qth percentile using the Nearest-Rank algorithm
 * (See Wikipedia: https://en.wikipedia.org/wiki/Quantile)
 */
const quantile = (samples: HourSamples, q: number) => {
  if (q < 0 || q > 1 || isNaN(q)) throw new Error(`Unable to calculate ${q} quantile`)
  const rank = (samples.length - 1) * q   // compute position/rank of q'th percentile within the array
  const idx = Math.round(rank)            // idx is rank rounded to an integer
  return samples[idx]                     // return the sample at that position
}

// prettier-ignore
// const smokeAreaConfig: Array<Array<[number, number]>> = [
//   [],                                           // 0
//   [ [0,1] ],                                    // 1
//   [ [0,1], [.25,.75] ],                         // 2
//   [ [0,1], [.15,.85], [.3,.7] ],                // 3
//   [ [0,1], [.1,.9], [.2,.8], [.3,.7] ],         // 4
//   [ [0,1], [.1,.9], [.2,.8], [.3,.7], [.4,.6] ] // 5
// ]

// export const calculateSmokeBands = (v: SmokeSampleList, bands: 0 | 1 | 2 | 3 | 4 | 5) => {
//   const bandKind = smokeAreaConfig[bands]
//   return bandKind.map(([from, to]) => [quantile(v, from), quantile(v, to)] as [number, number])
// }

/**
 * calculateSmokeBounds - Use the percentiles to return corresponding samples
 *    at the bounds of those percentile ranges
 *    Will be called on each row of the full SmokeData array
 * @param v - samples from one row of the SmokeData
 * @param percentiles
 * @return flat array holding samples at the edge of each range. For example:
 *  v = [ 0, 5, 10, 15, ... 495, 500 ]
 *  percentiles = [ [0, 1], [0.05, 0.95], [0.45, 0.55] ]
 *  result = [ 0, 500, 50, 450, 125, 375 ]
 *  That is, 0th & 100th percentile; 5th & 95th percentile, and 45th & 55th...
 *  Note: There are three sub-arrays in percentiles,
 *     so there are 3 pairs of values in the result
 */
export const calculateSmokeBounds = (v: HourSamples, percentiles: (number[])[]) => {
  return percentiles.map(([from, to]) => [quantile(v, from), quantile(v, to)] as [number, number])
}

// prettier-ignore
// const flameAreaConfig = [
//   [],                       // 0
//   [ .5 ],                   // 1
//   [ .5, .75 ],              // 2
//   [ .5, .7, .9 ],           // 3
//   [ .4, .55, .7, .85 ],     // 4
//   [ .5, .6, .7, .8, .9 ]    // 5
// ]

/**
 * SmokeChart builds Smoke Charts.
 *
 *
 */
export const Smokechart = (smokeData?: SmokeData | Partial<SmokechartProps>, opts?: Partial<SmokechartProps>) => {
  const smokeProps: SmokechartProps = {
    scaleX: scaleLinear(),
    scaleY: scaleLinear(),
    percentiles: [ [0,1], [.1,.9], [0.25, 0.75] ],  // default percentiles
    /* This gives boundaries/smokeBands at:
     * Min & Max
     * 10th & 90th percentile (80% of samples are within this range)
     * 25th & 75th percentile (50% of samples are within this range)
     */
    // smokeColor: "#000000",
    smokeOpacity: [0.18],
    // medianColor: "#1976D2", // blue-700
    // medianColor: "#388E3C", // green-700
    // errorColor: "#D32F2F",  // red-700
    // numStripes: 0           // 0 means use actual number of rows,
    //                              otherwise inject rows at front to make enough stripes
  }

  let cleanedData: SmokeData = []          // class variable to hold The Data (raw samples, sorted, less NaN)
  let hourErrs: number[] = [];             // class variable to hold %NaN for each row/hour
  // let hourMedian: number[] = [];           // class variable to hold median for each row/hour
  let classSuffix = Math.floor(Math.random() * 100000) // random number to append to classname

  /**
   * smoke (SmokeData, SmokechartProps)
   * @param smokeData
   * @param opts
   *
   * Two ways to call the smoke() function:
   *   smoke(SmokeData, options) - sets the options from the passed-in options
   *   smoke(<something that looks like "partial options" - sets the options, clears smokeData)
   * options are always merged with the existing/default smokeProps
   */
  const smoke = (smokeData?: SmokeData | Partial<SmokechartProps>, opts?: Partial<SmokechartProps>) => {
    if (smokeData && !Array.isArray(smokeData)) {
      opts = smokeData
      smokeData = undefined
    }
    if (opts) Object.assign(smokeProps, opts)
    if (smokeData) smoke.data(smokeData)

    classSuffix = Math.floor(Math.random() * 100000)
    return smoke
  }

  /**
   * obj.data() initializes the smokechart matrix of samples, returning chainable object or returns current data if arg was omitted
   */
  smoke.data = (smokeData?: SmokeData) => {
    if (smokeData) {
      // clone data while sorting each row
      cleanedData = smokeData.map(arr => [...arr.filter(n => !isNaN(n))]
          .sort((a, b) => a - b))
      hourErrs = [0.5, 1, 0];        // BOGUS Error Data
      return smoke
    }
    return cleanedData
  }

  /**
   * obj.adjustScaleRange() fixes X/Y scale input ranges to fit chart properly, useful to call when data changed
   */
  smoke.adjustScaleRange = () => {
    if (smokeProps.scaleX) smokeProps.scaleX.domain([0, cleanedData.length])
    if (!smokeProps.scaleY) return
    let minY = Infinity
    let maxY = -Infinity
    cleanedData.forEach(arr => {
      if (arr.length) {
        if (arr[0] < minY) minY = arr[0]
        if (arr[arr.length - 1] > maxY) maxY = arr[arr.length - 1]
      }
    })
    smokeProps.scaleY.domain([minY, maxY])
    return smoke // allow chaining by returning original
  }

  /**
   * obj.scaleX() and obj.scaleY() are getter/setters for smokechart prop elements
   */
  smoke.scaleX = (newScale?: ScaleLinear<number, number>) => {
    if (newScale) {
      smokeProps.scaleX = newScale
      return smoke
    }
    return smokeProps.scaleX
  }
  smoke.scaleY = (newScale?: ScaleLinear<number, number>) => {
    if (newScale) {
      smokeProps.scaleY = newScale
      return smoke
    }
    return smokeProps.scaleY
  }

  /**
   * obj().line(quantile) returns quantile-dictated line for drawing in the chart's context
   * quantile could be any number 0 to 1, defaults to "median", 0.5
   */
  smoke.line = (q: number = 0.5) => {
    const l = line<[number, number]>()
      .x(d => (smokeProps.scaleX ? smokeProps.scaleX(d[0]) : d[0]))
      .y(d => (smokeProps.scaleY ? smokeProps.scaleY(d[1]) : d[1]))

    const quantileData = cleanedData.reduce<Array<[number, number]>>((result, values, idx) => {
      const p = quantile(values, q)
      return [...result, [idx - 0.5, p], [idx + 0.5, p]]
    }, [])

    return [l(quantileData)]
  }

  // =========== Remove this at some point ============
  ///** obj().smokeBands(N) returns array of shapes to draw as "smoke bands" */
  // smoke.smokeBands = (bCount: 1 | 2 | 3 | 4 | 5 = 2) => {
  //   const l = line<[number, number]>()
  //     .x(d => (smokeProps.scaleX ? smokeProps.scaleX(d[0]) : d[0]))
  //     .y(d => (smokeProps.scaleY ? smokeProps.scaleY(d[1]) : d[1]))
  //
  //   const bands = cleanedData.reduce<string[][]>((result, values, idx) => {
  //     const bounds = calculateSmokeBands(values, bCount)
  //     const x = idx - 0.5
  //     const bandLines = bounds.map(
  //       ([y0, y1]) =>
  //         l([
  //           [x, y0],
  //           [x, y1],
  //           [x + 1, y1],
  //           [x + 1, y0],
  //         ]) || ""
  //     )
  //     return [...result, bandLines]
  //   }, [] as string[][])
  //
  //   // each set contains lines for same X value but we best to join
  //   // lines for same color (bands is matrix of [rowIdx][columnIdx])
  //   return bands[0].map((_, columnIdx) => bands.map(row => row[columnIdx]).join(""))
  // }

  /**
   * smokeBands - Given a set of percentiles, returns array of shapes to draw as "smoke bands"
   * @param percentiles
   * @return scaled X/Y values for charting
   *
   * This proceeds in two passes:
   * 1) scan each row of the cleanedData to determine the bounds (sample values at each boundary)
   * 2) Use those bounds to calculate X/Y for charting (I think???)
   */
  smoke.smokeBands = (percentiles:(number[])[] = smokeProps.percentiles ) => {
    const l = line<[number, number]>()
        .x(d => (smokeProps.scaleX ? smokeProps.scaleX(d[0]) : d[0]))
        .y(d => (smokeProps.scaleY ? smokeProps.scaleY(d[1]) : d[1]))

    const bands = cleanedData.reduce<string[][]>((result, values, idx) => {
      const bounds = calculateSmokeBounds(values, percentiles)
      console.log(`smokeBounds: ${bounds}`) // display the samples at the bounds of the "smoke"

      const x = idx - 0.5
      const bandLines = bounds.map(
          ([y0, y1]) =>
              l([
                [x, y0],
                [x, y1],
                [x + 1, y1],
                [x + 1, y0],
              ]) || ""
      )
      return [...result, bandLines]
    }, [] as string[][])

    // each set contains lines for same X value but we best to join
    // lines for same color (bands is matrix of [rowIdx][columnIdx])
    return bands[0].map((_, columnIdx) => bands.map(row => row[columnIdx]).join(""))
  }

  /**
   * obj.countErrors(sampleCount) returns number of samples missing in each of the listed samples
   * sampleCount defaults to max number of samples within list of elements given in cleanedData
   *
   * Returns list of {x, errPos} tuples where errPos grows from 0 to sampleCount for each set of samples in data
   *
   * NOTE: This code implements the understanding that there should be a fixed number
   *    of samples in a row. It will be replaced by code that counts the number of
   *    missing samples (e.g., NaN) to tint the smoke.
   */
  smoke.countErrors = (sampleCount: number = -1) => {
    const values = cleanedData.map(list => list.length)
    const desired = sampleCount >= 0 ? sampleCount : Math.max(...values)
    // note that the err count could not be below 0
    const underCount = values.map(ln => (desired > ln ? desired - ln : 0))
    // list above is positioned error count... let's transform it to desired format
    return underCount.reduce<Array<{ x: number; errPos: number }>>((ret, under, idx) => {
      if (under > 0) {
        const elements = []
        const x = smokeProps.scaleX ? smokeProps.scaleX(idx) : idx
        for (let errPos = 0; errPos < under; errPos++) elements.push({ x, errPos })
        return [...ret, ...elements]
      }
      return ret
    }, [])
  }

  /**
   * fillSmoke() - fill the chart with the proper color smoke
   * @param d - the area to be filled
   * @param i - the i'th element - used to retrieve the opacity from smokeOpacity
   * @returns string "rgba(R,G,B,opacity)"
   */
  smoke.fillSmoke = (d: string, i: number) => {
    return "rgba(0,0,0,0.18)"
    // return rgb(0,0,0,0.18)
  }

  /** obj.smokechart renders fully functional chart */
  smoke.chart = (selection: any, args?: SmokechartArgs) => {
    if (args?.bands) {
      selection
        .selectAll("path.smokechart-band" + classSuffix)
        .data(smoke.smokeBands())
        .enter()
        .append("path")
        .classed("smokechart-band", true)
        .attr("fill", "rgba(0,0,0,0.18)")
        .attr("d", (d: string) => d)
    }

    selection
      .selectAll("path.smokechart-line" + classSuffix)
      .data(smoke.line(0.5))
      .enter()
      .append("path")
      .classed("smokechart-line", true)
      .attr("stroke", "#ff0000")
      .attr("stroke-width", 1.1)
      .attr("fill", "transparent")
      .attr("d", (d: string) => d)

    if (args?.errors) {
      const errors = smoke.countErrors() || []
      if (errors.length) {
        let r = smokeProps.scaleX(0.25) - smokeProps.scaleX(0)
        if (r < 2) {
          r = 2
        }
        selection
          .selectAll("circle.smokechart-baseline" + classSuffix)
          .data(errors)
          .enter()
          .append("circle")
          .attr("cx", (d: { x: number }) => d.x)
          .attr("cy", (d: { errPos: number }) => r + d.errPos * r * 2.2)
          .attr("r", r)
          .attr("fill", "#f30")
      }
    }
  }

  return smoke(smokeData, opts)
}
