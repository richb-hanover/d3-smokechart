import { Smokechart, calculateSmokeBands } from "../src/"

import test from "tape"

test("Bands", t => {
  const bands = calculateSmokeBands([1, 2, 4, 10], [ [0.1, 0.9] ])
  console.log(bands)
  t.end()
})

test("Constructor", t => {
  const chart1 = Smokechart({})
  t.true(Boolean(chart1), "Constructor works")

  const chart2 = Smokechart()
  t.true(Boolean(chart1), "Constructor takes params")

  t.end()
})
