import * as toHash from 'object-hash'

type Literal = number | string | boolean
type ObjectRef = { [key: string]: Ref } | {}
type Ref = Literal | ObjectRef | (Literal | ObjectRef)[]

export default function deepSort<T extends Ref>(ref: T): T {
  if (Array.isArray(ref)) {
    const hashToCell: ObjectRef = ref.reduce<ObjectRef>(
      (acc, cell) => Object.assign({}, acc, { [toHash(cell)]: cell }),
      {},
    )
    const sortedArray = ref
      .map<string>(cell => toHash(cell))
      .sort()
      .map<Ref>(hash => hashToCell[hash])

    return sortedArray as T
  }

  if (typeof ref === 'object') {
    const objWithSortedValues = Object.entries(ref)
      .map<[string, Ref]>(([key, value]) => [key, deepSort(value)])
      .reduce<Ref>((acc, [key, value]) => Object.assign({}, acc, { [key]: value }), {})
    const sortedObj = Object.keys(objWithSortedValues)
      .sort()
      .reduce<Ref>((acc, key) => Object.assign({}, acc, { [key]: objWithSortedValues[key] }), {})

    return sortedObj as T
  }
  return ref
}
