import { Smokechart, calculateSmokeBounds } from "../src/"

import test from "tape"

test("Bands", t => {
  const bands = calculateSmokeBounds([1, 2, 4, 10], [ [0.1, 0.9] ])
  console.log(bands)
  t.end()
})

test("Constructor", t => {
  const chart1 = Smokechart([ [1] ])
  t.true(Boolean(chart1), "Constructor works")

  const chart2 = Smokechart([ [1] ], {smokeOpacity:[0.7]})
  t.true(Boolean(chart2), "Constructor takes params")

  t.end()
})
