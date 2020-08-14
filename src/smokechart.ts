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
    // numStripes: number;
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
        // numStripes: 0           // 0 means use actual number of rows,
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
            console.log("And why doesn't it fill the full DOM element?")

        }
        if (!this.smokeProps.scaleY) return
        let minY = Infinity
        let maxY = -Infinity
        this.cleanedData.forEach(arr => {
            if (arr.length) {
                if (arr[0] < minY) minY = arr[0]
                if (arr[arr.length - 1] > maxY) maxY = arr[arr.length - 1]
            }
        })
        this.smokeProps.scaleY.domain([minY, maxY])
        console.log("X domain: " + JSON.stringify([0, this.cleanedData.length]))
        console.log("Y domain: " + JSON.stringify([minY, maxY]))

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
     * 1) scan each row of the cleanedData to determine the bounds (sample values at each boundary)
     * 2) Use those bounds to calculate X/Y for charting (I think???)
     */
    computeSmokeBandPaths() {
       // pathGen is a function that generates a rectangular path from its two input values
        const pathGen = line<[number, number]>()
            .x(d => (this.smokeProps.scaleX ? this.smokeProps.scaleX(d[0]) : d[0]))
            .y(d => (this.smokeProps.scaleY ? this.smokeProps.scaleY(d[1]) : d[1]))

        // for each row of cleanedData:
        //  - compute its bounds (samples at the edge of the percentile bands)
        //  - map each set of bounds into a (rectangular) path
        //  - return that
        const bands = this.cleanedData
            .reduce<string[][]>((result, values, idx) => {
                const bounds = this._calculateSmokeBounds(values, this.smokeProps.percentiles)
                // console.log(`smokeBounds: ${bounds}`) // display the samples at the bounds of the "smoke"

                const x = idx - 0.5
                const bandLines = bounds.map(
                    ([y0, y1]) =>
                        pathGen([
                            [x, y0],
                            [x, y1],
                            [x + 1, y1],
                            [x + 1, y0],
                        ]) || ""
                )
                return [...result, bandLines]
            }, [] as string[][])

        // console.log(`bands: ${JSON.stringify(bands)}`)
        // each set contains lines for same X value but we best to join
        // lines for same color (bands is matrix of [rowIdx][columnIdx])
        return bands[0].map((_, columnIdx) => bands.map(row => row[columnIdx]).join(""))
    }

    /**
     * computeSmokeMedianPath(quantile) - return a line at the "median" for the chart
     * quantile (q) could be any number 0 to 1, defaults to "median", 0.5
     * @param q - the "quantile" to select (0.5 => 50th percentile)
     * @return a set of D3 lines to pass to D3.data()
     */
    computeSmokeMedianPath(q: number = 0.5) {
        const lineGen = line<[number, number]>()
            .x(d => (this.smokeProps.scaleX ? this.smokeProps.scaleX(d[0]) : d[0]))
            .y(d => (this.smokeProps.scaleY ? this.smokeProps.scaleY(d[1]) : d[1]))

        const quantileData = this.cleanedData
            .reduce<Array<[number, number]>>((result, values, idx) => {
                const p = this._quantile(values, q)
                return [...result, [idx - 0.5, p], [idx + 0.5, p]]
            }, [])

        return [lineGen(quantileData)]
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
     * _calculateSmokeBounds - Use the percentiles to return corresponding samples
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
// @ts-ignore
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
