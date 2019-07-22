import { load as actionLoad } from './actions'
import { StorageEngine } from './types'

export function createLoader(engine: StorageEngine) {
  return async store => {
    const dispatchLoad = state => store.dispatch(actionLoad(state))
    const newState = await engine.load()
    dispatchLoad(newState)
    return newState
  }
}
