# Smokechart class

d3.Smokechart is a class that takes Smokedata (array of array of numbers)
and prepares an intermediate form suitable for handing off
to the [D3 visualization package.](https:/d3js.org)
Those numbers might represent response times for a process/device,
and each array row might contain the times collected during an hour.
(The original use case for this is to record and display ping
response times in a network.
The resulting chart displays vertical bars representing each hour's performance.)

*Smokechart* constructor is called with an array of Smokedata and some options.
It returns a function that may be called to provide the data to D3.
Along the way, it prepares an array (with the same number of rows) suitable for a stacked array display in D3.

Smoke Charts show percentiles.
The bands show the edges of the percentile boundaries.
For example:

![percentile image](../docs/PercentileBars.png)

*Note:* The image above envisioned specifying bands as increasing breakpoints.
Current code specifies bands as array of arrays whose items are
pairs of numbers, the "outside values" specified first.
viz, `[ [0, 1], [0.1, 0.9], [0.25, 0.75] ]`

Each vertical stripe shows the *range* of the sample values that are
within the percentiles specified by the bound.
For example, the band for `[0.1, 0.9]` shows the samples that are between the
10th percentile and the 90th percentile of the range.

**Missing Values:** The smokechart is insensitive to the number of data values for each time interval.
That is, it will accurately display the spread of sample values, no matter how many are present.
However, it is useful also to indicate the number of "missing" values
(where, for example, a ping was sent but no response was ever received.)
This "packet loss" is an orthogonal indication of a network impairment
(separate from the response times being plotted.)
The chart can color ("tint") the smoke bands showing the percentage of
dropped packets/missing values to indicate that there were problems
unrelated to the reponse times.

**Parameters & Data:** 

* The SmokeData (raw samples)
* Bands
* Smoke color
* Median color
* Error color
* X/Y Bounds
* Number of vertical stripes

**Error Processing:** The simplest way to handle programming errors (such as overlapping ranges, bad data, etc.)
would be to inject a text() element into the SVG with the error message.
No exceptions necessary, and the text should make it obvious what the author needs to fix.
For example: 

* "Cannot plot bands of [ [0,0.5], [0.25, 0.75] ]" (since they overlap)
* "Cannot plot bands of [ 0, 1, 2 ]" (since it's not a well-formed array of arrays.)
* "Cannot plot bands of [ [0, 1], 'text' ]" (C'mon...)

**Handling Peculiar Data Situations:** ~~(earlier versions of the document
envisioned that bounds would not always be in pairs.
No need to handle this now.)~~

**Sanity Checking:**

* Does [0.1, 0.9] actually contain the 10th & 90th percentile samples?
* Are the bands actually drawn correctly, or do they use some computed notion of
"where they oughta be..." (see d3.quantile(smokeData[2], 0.2) discussion...

## *Smokechart* Functions

Each of these functions returns the class object so they can be chained.

* **smoke(SmokeData, Opts?)** - This function can be called to return the chartable data array.

* **data(Smokedata)** - This function sets the class variable *cleanedData* to the input, with each row sorted.
It also removes NaN values.

* **adjustScaleRange()** - This function adjusts the X/Y scale input ranges to fit the chart properly
* 
