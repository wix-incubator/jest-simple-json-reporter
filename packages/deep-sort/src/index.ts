import * as toHash from 'object-hash'

type Literal = number | string | boolean
type ObjectRef = { [key: string]: Ref }
type ArrayRef = Ref[]
type Ref = Literal | ArrayRef | ObjectRef

export default function deepSort<T extends Ref>(ref: T): T {
  if (Array.isArray(ref)) {
    const hashToCell: ObjectRef = ref.reduce((acc, cell) => ({ ...acc, [toHash(cell)]: cell }), {})
    const sortedArray = ref
      .map(cell => toHash(cell))
      .sort()
      .map(hash => hashToCell[hash]) as T

    return sortedArray
  }
  if (typeof ref === 'object') {
    const objWithSortedValues = Object.entries(ref)
      .map(([key, value]) => [key, deepSort(value)])
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}) as T
    const sortedObj = Object.keys(objWithSortedValues)
      .sort()
      // @ts-ignore
      .reduce((acc, key) => ({ ...acc, [key]: objWithSortedValues[key] }), {}) as T

    return sortedObj
  }
  return ref
}
