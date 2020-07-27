import { Smokechart, calculateSmokeBounds } from "../src/"

import test from "tape"

test("Bands", t => {
  const bands = calculateSmokeBounds([1, 2, 4, 10], [ [0.1, 0.9] ])
  console.log(bands)
  t.end()
})

test("Constructor", t => {
  const data = [ [1] ]
  const chart1 = Smokechart(data )
  t.true(Boolean(chart1), "Constructor works")

  const chart2 = Smokechart(data, {smokeOpacity: [0.18, 0.10]})
  t.true(Boolean(chart1), "Constructor takes params")

  t.end()
})
