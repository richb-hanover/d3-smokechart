/**
 * Smokechart - prepare a series of samples for display as a Smoke Chart.
 */

import {ScaleLinear, scaleLinear} from "d3-scale"
import {line} from "d3-shape";

export type HourSamples = number[]      // array of "data samples" measured during an hour
export type SmokeData = HourSamples[]   // multiple hour's worth of data

export interface SmokechartProps {
    scaleX: ScaleLinear<number, number>
    scaleY: ScaleLinear<number, number>
    percentiles: (number[])[],
    chartMode?: "smoke" | "flame"
    // smokeColor: string;
    smokeOpacity: number[];
    // medianColor: string;
    // errorColor: string
    numStripes: number;
}

/**
 * SmokeChart() - a class to build Smoke Charts.
 * @param smokeData - an array containing the raw data samples to be charted
 * @param opts - modifications to be merged into default SmokechartProps
 * @return this
 */
export class Smokechart {

    smokeProps: SmokechartProps = {
        scaleX: scaleLinear(),
        scaleY: scaleLinear(),
        percentiles: [[0, 1], [.1, .9], [0.25, 0.75]],  // default percentiles
        /* This gives boundaries/smokeBands at:
         * Min & Max
         * 10th & 90th percentile (80% of samples are within this range)
         * 25th & 75th percentile (50% of samples are within this range)
         */
        chartMode: "smoke",
        // smokeColor: "#000000",
        smokeOpacity: [0.18],
        // medianColor: "#1976D2", // blue-700
        // medianColor: "#388E3C", // green-700
        // errorColor: "#D32F2F",  // red-700
        numStripes: 0              // 0 means use actual number of rows,
        //                              otherwise inject rows at front to make enough stripes
    }
    cleanedData: SmokeData = []          // class variable to hold The Data (raw samples, sorted, less NaN)
    hourErrs: number[] = []              // class variable to hold %NaN for each row/hour
    // hourMedian: number[] = []         // class variable to hold median for each row/hour
    classSuffix: number

    /**
     * Smokechart.constructor() - initialize the class
     * @param smokeData
     * @param opts
     */
    constructor(smokeData: SmokeData, opts?: Partial<SmokechartProps>) {
        this.classSuffix = Math.floor(Math.random() * 100000) // random number to append to classname
        if (opts) this.addProps(opts)
        this.cleanData(smokeData)
    }

    /**
     * addProps(Partial<SmokechartProps>)
     * @param newProps set of properties to add to the default SmokechartProps
     * @return smokeProps
     */
    addProps(newProps?: Partial<SmokechartProps>) {
        if (newProps) Object.assign(this.smokeProps, newProps)
        return this;
    }

    /**
     * cleanData() - clean up the passed-in SmokeData, remove NaN, and sort remaining hourly samples
     * @param smokeData
     */
    cleanData(smokeData: SmokeData) {
        this.cleanedData = smokeData.map(arr => [...arr.filter(n => !isNaN(n))]
            .sort((a, b) => a - b))
        if (this.smokeProps.numStripes !== 0) {
            for (let i = 0; i < this.smokeProps.numStripes - smokeData.length; i++) {
                this.cleanedData.unshift([])
            }
        }
        this.hourErrs = [0.5, 1, 0];        // BOGUS Error Data
        this.adjustScaleRange()
        return this;
    }

    /**
     * adjustScaleRange() - use the scaleX & scaleY props to adjust the scales
     *    to make the data fit into the bounds of the DOM element
     */
    adjustScaleRange() {
        // @ts-ignore
        if (this.smokeProps.scaleX) {
            this.smokeProps.scaleX.domain([0, this.cleanedData.length])
        }
        if (!this.smokeProps.scaleY) return
        let minY = Infinity
        let maxY = -Infinity
        this.cleanedData.forEach(arr => {           // for each (sorted) row of cleanedData
            if (arr.length) {                       // if this row has data
                minY = Math.min(minY,arr[0])        // arr[0] is that row's minimum
                maxY = Math.max(maxY, arr[arr.length - 1]) // last item is max
            }
        })
        this.smokeProps.scaleY.domain([minY, maxY])
        // console.log("X domain: " + JSON.stringify([0, this.cleanedData.length]))
        // console.log("Y domain: " + JSON.stringify([minY, maxY]))

        return this;
    }

    /**
     * fillSmoke() - fill the chart with the proper color smoke
     * @param d - the area to be filled
     * @param i - the i'th element - used to retrieve the opacity from smokeOpacity
     * @returns string "rgba(R,G,B,opacity)"
     */
    fillSmoke(d: string, i: number) {
        let ix = this.smokeProps.smokeOpacity.length - 1 // the last one in the array
        if (i < ix) {   // current i not past the end
            ix = i      // use i
        }
        const opacity = this.smokeProps.smokeOpacity[ix]
        return `rgba(0,0,0,${opacity})`
    }

    /**
     * computeSmokeBandPaths - Uses the percentiles from props to return array of paths to draw as "smoke bands"
     * @return a set of paths suitable to pass to D3.data()
     *
     * This proceeds in two passes:
     * 1) scan each row of the cleanedData to determine the bounds - the sample values at each boundary
     * 2) Use those bounds to calculate the bandEdges -
     */
    computeSmokeBandPaths() {
       // pathGen() generates a rectangular path from its input values
        const pathGen = line<[number, number]>()
            .defined( d => (d[1] !== undefined))  // filter out empty rows of samples
            .x(d => (this.smokeProps.scaleX ? this.smokeProps.scaleX(d[0]) : d[0]))
            .y(d => (this.smokeProps.scaleY ? this.smokeProps.scaleY(d[1]) : d[1]))

        // for each row of cleanedData:
        //  - compute its bounds (samples at the edge of the percentile bands)
        //  - map each set of bounds into a (rectangular) path for the (multiple) bands of smoke
        const bands = this.cleanedData
            .reduce<string[][]>((result, values, idx) => {
                const bounds = this._calculateSmokeBounds(values, this.smokeProps.percentiles)
                // console.log(`smokeBounds: ${JSON.stringify(bounds)}`) // display the samples at the bounds of the "smoke"

                const x = idx
                const bandEdges = bounds.map(
                    ([y0, y1]) =>
                        pathGen([
                            [x, y0],
                            [x, y1],
                            [x + 1, y1],
                            [x + 1, y0],
                        ]) || ""
                )
                return [...result, bandEdges]
            }, [] as string[][])

        // console.log(`bands: ${JSON.stringify(bands)}`)
        return bands[0].map((_, columnIdx) => bands.map(row => row[columnIdx]).join(""))
    }

    /**
     * computeSmokeMedianPath(quantile) - return a line at the "median" for the chart
     * quantile (q) could be any number 0 to 1, defaults to "median", 0.5
     * @param q - the "quantile" to select (0.5 => 50th percentile)
     * @return a set of D3 lines to pass to D3.data()
     *
     * NB: The medianLine always winds up being 8 px longer than the smokeBands
     * Not sure why. But it's clipped to the bounds of the SVG <g>, so it looks OK
     */
    computeSmokeMedianPath(q: number = 0.5) {

        // function to convert line segments (whose Y-values are samples)
        // and X-values are 0 .. N+1 to graph coordinates
        const lineGen = line<[number, number]>()
            .defined(d => !isNaN(d[0])) // [NaN,NaN] represents an empty sample row
            .x(d => (this.smokeProps.scaleX ? this.smokeProps.scaleX(d[0]) : d[0]))
            .y(d => (this.smokeProps.scaleY ? this.smokeProps.scaleY(d[1]) : d[1]))

        // Compute array of [X,Y] line segments with:
        // X value in the range of [0..N+1] for N rows of sample data
        // Y value of the sample to be plotted
        // Each "row" of sample data has two points at X and X+1
        // D3 will draw a line connecting each of the points in the array
        // If the row of samples is empty, instead
        //    substitute [NaN, NaN], [NaN, NaN] for the endpoints
        const lineSegments = this.cleanedData
            .reduce<Array<[number, number]>>((result, values, idx) => {
                if (values.length === 0) // if no samples for this row...
                    {return [...result, [NaN, NaN], [NaN, NaN] ]}
                // otherwise find the median (or q-th percentile)
                const p = this._quantile(values, q)
                // console.log([...result, [idx , p], [idx + 1, p]])
                return [...result, [idx , p], [idx + 1, p]]
            }, [])

        // console.log(lineGen(lineSegments))
        return [lineGen(lineSegments)]
    }

    /**
     * _quantile() - given a (sorted) array of samples, return the value at the q'th percentile
     * @param samples - array of numeric values
     * @param q - a float between (0 and 1)
     * @return single sample at the qth percentile using the Nearest-Rank algorithm
     * (See Wikipedia: https://en.wikipedia.org/wiki/Quantile)
     * Pseudo-private method with "_" prefix
     */
    _quantile(samples: HourSamples, q: number) {
        if (q < 0 || q > 1 || isNaN(q)) throw new Error(`Unable to calculate ${q} quantile`)
        const rank = (samples.length - 1) * q   // compute position/rank of q'th percentile within the array
        const idx = Math.round(rank)            // idx is rank rounded to an integer
        return samples[idx]                     // return the sample at that position
    }

    /**
     * _calculateSmokeBounds - Use the percentiles to return corresponding sample values
     *    at the bounds ("edges") of those percentile ranges
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
     * Pseudo-private method with "_" prefix
     */
    _calculateSmokeBounds(v: HourSamples, percentiles: (number[])[]) {
        return percentiles.map(([from, to]) => [this._quantile(v, from), this._quantile(v, to)] as [number, number])
    }

}

/**
 * Test code - just makes sure everything stays defined during development
 * Not intended as a real test...
 */
// @ts-ignore
function testAll() {
    const smokeData = [[1]]   // fake data
    const opts = {smokeOpacity: [0.15]}
    const theChart = new Smokechart(smokeData, opts)

// chainable methods
    theChart
        .addProps(opts)
        .cleanData(smokeData)
        .adjustScaleRange()

// these methods return something other than "this", and can't be chained
    theChart.computeSmokeBandPaths()
    theChart.computeSmokeMedianPath()
    theChart._quantile([1], 0.5)
    theChart._calculateSmokeBounds([1], [[0, 1], [0.1, 0.9]])
    theChart.fillSmoke("a", 0)
}
