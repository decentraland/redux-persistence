import isFunction from 'lodash/fp/isFunction'
import isObject from 'lodash/fp/isObject'
import { LOAD, SAVE, save } from './actions'
import { Action, PayloadMetaAction } from 'typesafe-actions'
import { StorageEngine, MiddlewareOptions, ReduxStore } from './types'
import { receivedFunctionalAction, receivedNonObjectAction, missingActionType, defaultErrorHandler } from './warnings'

function defaultTransformer<T>(state: T): T {
  return state
}

function isValidAction(action) {
  const isFunc = isFunction(action)
  const isObj = isObject(action)
  const hasType = isObj && action.hasOwnProperty('type')

  if (!isFunc && isObj && hasType) {
    return true
  }

  if (process.env.NODE_ENV !== 'production') {
    if (isFunc) {
      console.warn(receivedFunctionalAction())
    } else if (!isObj) {
      console.warn(receivedNonObjectAction(action))
    } else if (!hasType) {
      console.warn(missingActionType())
    }
  }

  return false
}

export function createMiddleware<T extends any>(engine: StorageEngine<T>, options: MiddlewareOptions<T> = {}) {
  const opts = Object.assign({ disableDispatchSaveAction: false }, options)

  return (store: ReduxStore<T>) => {
    const { dispatch, getState } = store
    return next => (action: Action) => {
      const result = next(action)

      if (!isValidAction(action)) {
        return result
      }

      const isOwnAction = action.type === SAVE || action.type === LOAD
      const isBlacklisted = isOwnAction || (options.filterAction && !options.filterAction(action))

      if (!isBlacklisted) {
        const transform = options.transform || defaultTransformer
        const saveState = transform(getState())
        const saveAction = save(saveState) as PayloadMetaAction<any, any, any>

        if (process.env.NODE_ENV !== 'production') {
          if (!saveAction.meta) {
            saveAction.meta = {}
          }
          saveAction.meta.origin = action
        }

        const dispatchSave = () => dispatch(saveAction)

        engine.save(saveState).then(
          () => {
            if (opts.disableDispatchSaveAction === false) {
              return dispatchSave()
            }
          },
          e => {
            if (options.onError) {
              options.onError(e, store)
            } else {
              if (process.env.NODE_ENV !== 'production') {
                console.warn(defaultErrorHandler())
              }
              console.error(e)
            }
          }
        )
      }

      return result
    }
  }
}
