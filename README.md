# D3 Smokechart

d3 plotting library to display the variance of a set of values
for a time interval as "smoky bands" surrounding the median value for that interval.

## Plotting Smokedata

The input data ("smokedata") is an array of arrays of numeric data.
Each row contains a set of data samples for a particular time period.
The resulting chart has grey areas that show the range of the samples
at certain thresholds above and below the median value.
Those band look like smoke, giving the chart its name.

The initial use case was to display 30-second samples of response times;
each vertical slice represents an hour of data.
Here is a sample of a smokechart:

![Sample Smoke Chart](docs/sample-smoke.png)

## Experimenting with Smokecharts

The file `example/smoke.html` has sample data that can be used to experiment with the appearence of the smokecharts.
The easiest way to use it is to install [**browser-sync**](https://browsersync.io/) globally, then run the following commands.
Changes to the `smoke.html` file trigger a browser reload.

```
cd path-to-d3-smokechart
browser-sync start --server --directory --files example/*.html
```
Then navigate to [examples/smoke.html](http://localhost:3000/example/smoke.html) and begin editing.

## Building the project

To run tests and create the UMD bundle suitable for publication:
```
nvm use 14.2.0 # (or other suitable, modern node version)
yarn run build
```

Ran into difficulties creating UMD build with a real Javascript class
so the following are alternative ways to build 
(from http://rollupjs.org/guide/en/#quick-start):

For browsers & Node:
```
# compile to a <script> to a UMD bundle - supply a *module-name*
rollup src/smokechart.ts --file umd/smokechart.js --format umd --name Smokechart
```
Then use *modulename* . *classname* on the web page as:
``````
<script src="http://localhost:3000/umd/smokechart.js"  ></script>
<script>
  const newChart = new Smokechart.Smokechart()
</script>
```

## Functions 

smoke.chart() -

smoke.data() - 

smoke.adjustScaleRange() -

smoke.scaleX() -

smoke.scaleY() -

smoke.line() - 

smoke.smokeBands(numBands) - 

quantile() - 

calculateSmokeBands() -

smoke.countErrors() - 

## Data structures

smokeData - array of arrays containing original data.  

smokeBands - 


smoke options - 

smokeAreaConfig - 

flameAreaConfig - 

