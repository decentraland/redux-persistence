import simpleMerger from 'redux-storage-merger-simple'
import { PayloadAction } from 'typesafe-actions'
import { LOAD } from './actions'
import { StateMerger } from './types'

export default function<T, A>(reducer, merger: StateMerger = simpleMerger) {
  return (state: T, action: PayloadAction<any, any>) => reducer(action.type === LOAD ? merger(state, action.payload) : state, action)
}
