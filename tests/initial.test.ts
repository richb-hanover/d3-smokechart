import { Smokechart, calculateSmokeBands } from "../src"

import test from "tape"

test("Bands", t => {
  const bands = calculateSmokeBands([1, 2, 4, 10], 2)
  t.deepEqual(bands, [
    [1, 10],
    [2, 6],
  ])
  t.end()
})

test("Constructor", t => {
  const chart1 = Smokechart({})
  t.true(Boolean(chart1), "Constructor works")

  const chart2 = Smokechart()
  t.true(Boolean(chart1), "Constructor takes params")

  t.end()
})
