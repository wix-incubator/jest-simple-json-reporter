import deepSort from '../src'
import test from 'ava'

test('number', t => {
  t.deepEqual(deepSort(1), 1)
})

test('string', t => {
  t.deepEqual(deepSort('aaa'), 'aaa')
})

test('array', t => {
  const actual = deepSort([1, 2])
  t.true(actual.length === 2)
  t.true(actual.includes(1))
  t.true(actual.includes(2))
})

test('object', t => {
  const actual = deepSort({ a: 1, b: 2 })
  t.true(Object.entries(actual).length === 2)
  t.deepEqual(actual.a, 1)
  t.deepEqual(actual.b, 2)
})

test('ensure pure function', t => {
  t.deepEqual(
    deepSort({
      a: [{ b: 1, c: [2, 3] }, [4, [5, 6]]],
    }),
    deepSort({
      a: [{ b: 1, c: [2, 3] }, [4, [5, 6]]],
    }),
  )
})

test('complex object with easy-to-sort data - ensure the result is currect', t => {
  const actual = deepSort({
    a: [{ b: 1, c: [2, 3] }, [4, [5, 6]]],
    d: 8,
  })
  t.deepEqual(actual.a.length, 2)
  t.true(
    (typeof actual.a[0] === 'object' && !Array.isArray(actual.a[0]) && Array.isArray(actual.a[1])) ||
      (typeof actual.a[1] === 'object' && !Array.isArray(actual.a[1]) && Array.isArray(actual.a[0])),
  )
  t.deepEqual(actual.d, 8)
  if (Array.isArray(actual.a[1])) {
    t.true(typeof actual.a[0] === 'object' && !Array.isArray(actual.a[0]))
    //@ts-ignore
    t.deepEqual(actual.a[0]['b'], 1)
    //@ts-ignore
    t.deepEqual(actual.a[0]['c'].length, 2)
    //@ts-ignore
    t.true(actual.a[0]['c'].includes(2) && actual.a[0]['c'].includes(3))
    //
    t.deepEqual(actual.a[1].length, 2)
    t.true(
      (actual.a[1][0] === 4 &&
        Array.isArray(actual.a[1][1]) &&
        actual.a[1][1].length === 2 &&
        actual.a[1][1].includes(5) &&
        actual.a[1][1].includes(6)) ||
        (actual.a[1][1] === 4 &&
          Array.isArray(actual.a[1][0]) &&
          actual.a[1][0].length === 2 &&
          actual.a[1][0].includes(5) &&
          actual.a[1][0].includes(6)),
    )
  } else {
    if (typeof actual.a[1] !== 'object' || Array.isArray(actual.a[1])) {
      t.fail('a[1] is not an object')
      return
    }
    if (!Array.isArray(actual.a[0])) {
      t.fail('a[0] is not an array')
      return
    }
    t.deepEqual(actual.a[1]['b'], 1)
    t.deepEqual(actual.a[1]['c'].length, 2)
    t.true(actual.a[1]['c'].includes(2) && actual.a[1]['c'].includes(3))
    //
    t.deepEqual(actual.a[0].length, 2)
    t.true(
      (actual.a[0][0] === 4 &&
        Array.isArray(actual.a[0][1]) &&
        actual.a[0][1].length === 2 &&
        actual.a[0][1].includes(5) &&
        actual.a[0][1].includes(6)) ||
        (actual.a[0][1] === 4 &&
          Array.isArray(actual.a[0][0]) &&
          actual.a[0][0].length === 2 &&
          actual.a[0][0].includes(5) &&
          actual.a[0][0].includes(6)),
    )
  }
})
