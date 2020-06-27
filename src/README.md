# Smokechart class

d3.Smokechart is a class that take Smokedata (array of array of numbers) and prepares an intermediate form suitable for handing off to the [D3 visualization package.](https:/d3js.org)
Those numbers might represent response times for a process/device, and each array row might contain the times collected during an hour.
The resulting chart displays vertical bars representing each hour's performance.

*Smokechart* constructor is called with an array of Smokedata and some options.
It returns a function that may be called to provide the data to D3.
Along the way, it prepares an array (with the same number of rows) suitable for a stacked array display in D3.

## *Smokechart* Functions

Each of these functions returns the class object so they can be chained.

* **smoke(SmokeData, Opts?)** - This function can be called to return the chartable data array.

* **data(Smokedata)** - This function sets the class variable *data* to the input, with each row sorted.
It also removes NaN values.

* **adjustScaleRange()** - This function adjusts the X/Y scale input ranges to fit the chart properly
* 



