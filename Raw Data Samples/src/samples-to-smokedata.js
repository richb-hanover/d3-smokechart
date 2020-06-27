/**
 *
 * samples-to-smokedata.js
 * Read a file of (numeric) readings, one per line, (these might be every-30-second samples)
 * and output rows containing 120 samples as a Javascript array.
 *
 * Special case a line of "NaN #" which inserts # instances of NaN into the arrays
 */

/**
 * linereader(theLines) - generator function to return the next sample
 * Initialize it with the path to the the input file
 * Split the input file on line boundaries into an array.
 * Then loop through the array, yielding the next value until no more
 * Special case lines of the form "NaN ###" in which case
 *    it unshifts ### copies of NaN onto the input
 * @param path
 * @returns {IterableIterator<*>}
 */

function* linereader(path) {
  const rawdata = fs.readFileSync(path).toString();
  const lines = rawdata.split("\n");        // this adds an extra blank line
  while(true) {
    let nextSample = lines.shift();                 // grab the next one
    if (nextSample === "") return;                  // hit the blank line; we're done
    if (nextSample.substring(0, 4) === "NaN ") {
      const count = parseInt(nextSample.substring(4));
      for (let i = 1; i < count; i++) {             // unshift N-1 copies back into the input
        lines.unshift("NaN");
      }
      nextSample = NaN;                             // set nextSample to NaN
    }
    yield parseFloat(nextSample);                     // yield back nextSample
  }
}

/**
 * replaceNaN - a JSON.stringify() replacer function that transforms
 *   NaN to "0/0" to serialize data containing NaN
 * Reading the data back in requires a JSON.parse() reviver that undoes that substitution
 * See https://stackoverflow.com/questions/21896792/force-json-stringify-to-emit-nan-infinity-or-js-json-lib-that-does-so
 * @param key
 * @param value
 * @returns {string}
 */
function replaceNaN(key, value) {
  if (value !== value) {
    return '0/0';
  }
  return value;
}

  /**
   * Main Routine
   *
   * Create the generator that'll handle the lines from the specified data file
   * Consume the data and line 'em up into array rows containing 120 samples
   * Output the JSON of the array rows to datafile-name-smokedata.txt
   */
  const fs = require('fs');
  const path = 'Raw Data Samples/pings';
  const gen = linereader(path+".txt");

  const dayValues = [];
  let hourValues = [];
  while (true) {
    let nextVal = gen.next();
    if (nextVal.value === undefined) break;
    hourValues.push(nextVal.value);
    if (hourValues.length >= 120) {
      dayValues.push(hourValues);
      hourValues = [];
    }
  }
  if (hourValues.length > 0) {
    dayValues.push(hourValues);
  }

  // Output the accumulated dayValues as JSON
  // replacing NaN with "0/0"
  // and breaking lines at the end of each row of the array
  const rawsmokedata = JSON.stringify(dayValues, replaceNaN,)
    .replace(/],/g, "],\n")
    .replace(/\[\[/, "[\n[")
    .replace(/]]/,"]\n]");

  console.log(rawsmokedata);

  // Finally write out the data to a JSON file
  fs.writeFileSync(path+'.json', rawsmokedata);



