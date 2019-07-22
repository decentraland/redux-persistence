<h1 align="center" style="border-bottom: none;">🗄 redux-persistence</h1>
<h3 align="center">Persistence layer for redux with flexible backends</h3>

## Features

- Flexible storage engines
  - [indexedDb](https://github.com/prateekbh/redux-storage-engine-indexed-db): based on window.indexedDb
  - [localStorage][]: based on window.localStorage
    - Or for environments without `Promise` support [localStorageFakePromise][]
  - [reactNativeAsyncStorage][]: based on `react-native/AsyncStorage`
  - [remoteEndpoint][]: save/load via XHR
- Flexible state merger functions
  - [simple][merger-simple]: merge plain old JS structures (default)
  - [immutablejs][merger-immutablejs]: merge plain old JS **and** [Immutable][]
    objects
- Storage engines can be async
- Load and save actions that can be observed
  - `{ type: 'REDUX_PERSISTENCE_SAVE', payload: /* state tree */ }`
  - `{ type: 'REDUX_PERSISTENCE_LOAD', payload: /* state tree */ }`
- Various engine decorators
  - [debounce][]: batch multiple save operations
  - [engines][]: use different storage types
  - [filter][]: only store a subset of the whole state tree
  - [immutablejs][]: load parts of the state tree as [Immutable][] objects
  - [migrate][]: versioned storage with migrations
- Black- and whitelist actions from issuing a save operation
- Proper storage limit handling
- Typescript support out of the box

## Usage

```js
import * as storage from 'redux-persistence'

// Import redux and all your reducers as usual
import { createStore, applyMiddleware, combineReducers } from 'redux'
import * as reducers from './reducers'

// We need to wrap the base reducer, as this is the place where the loaded
// state will be injected.
//
// Note: The reducer does nothing special! It just listens for the LOAD
//       action and merge in the provided state :)
// Note: A custom merger function can be passed as second argument
const reducer = storage.reducer(combineReducers(reducers))

// Now it's time to decide which storage engine should be used
//
// Note: The arguments to `createEngine` are different for every engine!
import createEngine from 'redux-storage-engine-localstorage'
const engine = createEngine('my-save-key')

// And with the engine we can create our middleware function. The middleware
// is responsible for calling `engine.save` with the current state afer
// every dispatched action.
//
// Note: you can declare an action filtering function in the options
const middleware = storage.createMiddleware(engine)

// As everything is prepared, we can go ahead and combine all parts as usual
const createStoreWithMiddleware = applyMiddleware(middleware)(createStore)
const store = createStoreWithMiddleware(reducer)

// At this stage the whole system is in place and every action will trigger
// a save operation.
//
// BUT (!) an existing old state HAS NOT been restored yet! It's up to you to
// decide when this should happen. Most of the times you can/should do this
// right after the store object has been created.

// To load the previous state we create a loader function with our prepared
// engine. The result is a function that can be used on any store object you
// have at hand :)
const load = storage.createLoader(engine)
load(store)

// Notice that our load function will return a promise that can also be used
// to respond to the restore event.
load(store)
  .then(newState => console.log('Loaded state:', newState))
  .catch(() => console.log('Failed to load previous state'))
```

## Details

### This is a fork of `redux-storage`

The original library has issues as old as 2017. This library is meant to fix some of those while also providing out-of-the-box typescript support.

### Engines, Decorators & Mergers

They all are published as own packages on npm. But as a convention all engines
share the keyword [redux-storage-engine][npm-engine], decorators can be found
with [redux-storage-decorator][npm-decorator] and mergers with
[redux-storage-merger][npm-merger]. So it's pretty trivial to find all
the additions to [redux-storage][] you need :smile:

### Actions

[redux-storage][] will trigger actions after every load or save operation from
the underlying engine.

You can use this, for example, to display a loading screen until the old state
has been restored like this:

```js
import { LOAD, SAVE } from 'redux-persistence'

function storeageAwareReducer(state = { loaded: false }, action) {
  switch (action.type) {
    case LOAD:
      return { ...state, loaded: true }

    case SAVE:
      console.log('Something has changed and written to disk!')

    default:
      return state
  }
}
```

### Middleware

You can configure the middleware by passing a second argument to `createMiddleware`.

#### `filterAction`

Return `true` for any action that should be accepted by the middleware.

Example:

```js
const blacklist = ['SOME_ACTION', 'SOME_OTHER_ACTION']
createMiddleware(engine, {
  filterAction: action => !blacklist.includes(action.type)
})
```

#### `transform`

Transform and return a new state before saving to the psrovided storage engine.

Example:

```js
createMiddleware(engine, {
  transform: state => {
    let newState = { ...state }

    // Remove some items from the state before saving
    for (let key in newState) {
      if (newState[key].isFlagged) {
        delete newState[key]
      }
    }

    return newState
  }
})
```

#### `disableDispatchSaveAction`

Don't dispatch a `REDUX_PERSISTENCE_SAVE` action after saving to the provided storage engine, `false` by default.

Example:

```js
createMiddleware(engine, {
  disableDispatchSaveAction: true
})
```

#### `onError`

Handle any errors thrown while trying to save to the provided storage engine.

Example:

```js
createMiddleware(engine, {
  onError: err => {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      // handle out of storage!
    }
  }
})
```

[merger-simple]: https://github.com/react-stack/redux-storage-merger-simple
[merger-immutablejs]: https://github.com/react-stack/redux-storage-merger-immutablejs
[npm-engine]: https://www.npmjs.com/browse/keyword/redux-storage-engine
[npm-decorator]: https://www.npmjs.com/browse/keyword/redux-storage-decorator
[npm-merger]: https://www.npmjs.com/browse/keyword/redux-storage-merger
[redux]: https://github.com/gaearon/redux
[immutable]: https://github.com/facebook/immutable-js
[redux-storage]: https://github.com/react-stack/redux-storage
[react-native]: https://facebook.github.io/react-native/
[localstorage]: https://github.com/react-stack/redux-storage-engine-localStorage
[localstoragefakepromise]: https://github.com/react-stack/redux-storage-engine-localStorageFakePromise
[reactnativeasyncstorage]: https://github.com/react-stack/redux-storage-engine-reactNativeAsyncStorage
[load]: https://github.com/react-stack/redux-storage/blob/master/src/constants.js#L1
[save]: https://github.com/react-stack/redux-storage/blob/master/src/constants.js#L2
[debounce]: https://github.com/react-stack/redux-storage-decorator-debounce
[engines]: https://github.com/allegro/redux-storage-decorator-engines
[filter]: https://github.com/react-stack/redux-storage-decorator-filter
[migrate]: https://github.com/mathieudutour/redux-storage-decorator-migrate
[immutablejs]: https://github.com/react-stack/redux-storage-decorator-immutablejs
[remoteendpoint]: https://github.com/bionexo/redux-storage-engine-remoteendpoint
