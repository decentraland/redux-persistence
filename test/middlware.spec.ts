import test from 'ava'
import sinon from 'sinon'
import future from 'fp-future'
import { Action } from 'typesafe-actions'
import { createMiddleware, SAVE } from '../src/index'
import { receivedFunctionalAction, receivedNonObjectAction, missingActionType, defaultErrorHandler } from '../src/warnings'

test('middleware - should call next with the given action', async t => {
  const engine = { save: sinon.stub().resolves(), load: sinon.stub() }
  const store = { getState: sinon.spy(), dispatch: sinon.spy() }
  const next = sinon.spy()
  const action = { type: 'dummy' }
  createMiddleware(engine)(store)(next)(action)
  t.is(next.calledWith(action), true)
})

test('middleware - should return the result of next', async t => {
  const nextResult = 'nextResult'
  const engine = { save: sinon.stub().resolves(), load: sinon.stub() }
  const store = { getState: sinon.spy(), dispatch: sinon.spy() }
  const next = sinon.stub().returns(nextResult)
  const action = { type: 'dummy' }
  const result = createMiddleware(engine)(store)(next)(action)
  t.is(result, nextResult)
})

test('middleware - should ignore filtered actions', async t => {
  const store = { getState: sinon.spy(), dispatch: sinon.spy() }
  const engine = { save: sinon.stub().resolves(), load: sinon.stub() }
  const next = sinon.spy()
  const action = { type: 'IGNORE_ME' }
  const handleFilter = (a: Action) => a.type !== 'IGNORE_ME'
  createMiddleware(engine, { filterAction: handleFilter })(store)(next)(action)
  t.is(engine.save.called, false)
})

test('middleware - should accept non-filtered actions', async t => {
  const store = { getState: sinon.spy(), dispatch: sinon.spy() }
  const engine = { save: sinon.stub().resolves(), load: sinon.stub() }
  const next = sinon.spy()
  const action = { type: 'ALLOWED' }
  const handleFilter = () => true
  createMiddleware(engine, { filterAction: handleFilter })(store)(next)(action)
  t.is(engine.save.called, true)
})

test('middleware - should pass the whole action to filter function', async t => {
  const engine = { save: sinon.stub().resolves(), load: sinon.stub() }
  const store = { getState: sinon.spy(), dispatch: sinon.spy() }
  const next = sinon.spy()
  const action = { type: 'ALLOWED' }
  const handleFilter = sinon.stub().returns(true)
  createMiddleware(engine, { filterAction: handleFilter })(store)(next)(action)
  t.is(handleFilter.calledWith(action), true)
})

test('middleware - should skip function based actions and warn', async t => {
  const warn = sinon.stub(console, 'warn')
  const engine = { save: sinon.stub().resolves(), load: sinon.stub() }
  const store = { getState: sinon.spy(), dispatch: sinon.spy() }
  const next = sinon.spy()
  const action = () => ({ type: 'ALLOWED' })
  createMiddleware(engine)(store)(next)(action as any)
  t.is(warn.firstCall.args[0], receivedFunctionalAction())
  warn.restore()
})

test('middleware - should skip non-object based actions and warn', async t => {
  const warn = sinon.stub(console, 'warn')
  const engine = { save: sinon.stub().resolves(), load: sinon.stub() }
  const store = { getState: sinon.spy(), dispatch: sinon.spy() }
  const next = sinon.spy()
  const action = 'SOME_ACTION'
  createMiddleware(engine)(store)(next)(action as any)
  t.is(warn.firstCall.args[0], receivedNonObjectAction(action))
  warn.restore()
})

test('middleware - should skip actions with missing type field and warn', async t => {
  const warn = sinon.stub(console, 'warn')
  const engine = { save: sinon.stub().resolves(), load: sinon.stub() }
  const store = { getState: sinon.spy(), dispatch: sinon.spy() }
  const next = sinon.spy()
  const action = { payload: null }
  createMiddleware(engine)(store)(next)(action as any)
  t.is(warn.firstCall.args[0], missingActionType())
  warn.restore()
})

test('middleware - should pass the current state to engine.save', async t => {
  const state = { x: 42 }
  const engine = { save: sinon.stub().resolves(), load: sinon.stub() }
  const store = { getState: sinon.stub().returns(state), dispatch: sinon.spy() }
  const next = sinon.spy()
  const action = { type: 'ACTION', payload: null }

  createMiddleware(engine)(store)(next)(action)
  t.is(engine.save.calledWith(state), true)
})

test('middleware - should hide origin meta from production SAVE action', async t => {
  let dispatchDone = future<void>()
  const sandbox = sinon.createSandbox()
  sandbox.stub(process.env, 'NODE_ENV').value('production')
  const state = { x: 42 }
  const next = sinon.spy()
  const action = { type: 'TO_BE_SAVED' }
  const engine = {
    save: () => {
      dispatchDone.resolve()
      return Promise.resolve()
    },
    load: sinon.stub()
  }
  const store = {
    getState: sinon.stub().returns(state),
    dispatch: sinon.stub()
  }

  createMiddleware(engine)(store)(next)(action)

  await dispatchDone

  const dispatchedAction = store.dispatch.firstCall.args[0] as any
  t.is(dispatchedAction.payload, state)
  t.is(dispatchedAction.type, SAVE)
  t.is(dispatchedAction.meta, undefined)
  sandbox.restore()
})

test('middleware - should trigger a SAVE action after engine.save', async t => {
  const dispatchDone = future<void>()
  const state = { x: 42 }
  const next = sinon.spy()
  const action = { type: 'TO_BE_SAVED' }
  const engine = {
    save: () => {
      dispatchDone.resolve()
      return Promise.resolve()
    },
    load: sinon.stub()
  }
  const store = {
    getState: sinon.stub().returns(state),
    dispatch: sinon.stub()
  }

  createMiddleware(engine)(store)(next)(action)

  await dispatchDone
  const dispatchedAction = store.dispatch.firstCall.args[0] as any
  t.is(dispatchedAction.payload, state)
  t.is(dispatchedAction.type, SAVE)
  t.is(dispatchedAction.meta.origin, action)
})

test('middleware - should allow disableDispatchSaveAction == true ', async t => {
  const dispatchDone = future<void>()
  const store = { getState: sinon.spy(), dispatch: sinon.stub() }
  const next = sinon.stub()
  const action = { type: 'dummy' }
  const engine = {
    save: () => {
      dispatchDone.resolve()
      return Promise.resolve()
    },
    load: sinon.stub()
  }

  createMiddleware(engine, {
    disableDispatchSaveAction: true
  })(store)(next)(action)

  await dispatchDone

  t.is(store.dispatch.firstCall, null)
})

test('middleware - should handle storage engine errors with default handler', async t => {
  const consoleError = sinon.stub(console, 'error')
  const warn = sinon.stub(console, 'warn')
  const ready = future<boolean>()
  const store = { getState: sinon.spy(), dispatch: sinon.stub() }
  const next = sinon.stub()
  const action = { type: 'dummy' }
  const engine = {
    save: () => {
      ready.resolve(true)
      return Promise.reject(new Error('Beep boop, out of space'))
    },
    load: sinon.stub()
  }

  createMiddleware(engine)(store)(next)(action)

  await ready
  t.is(store.dispatch.firstCall, null)
  t.is(warn.firstCall.args[0], defaultErrorHandler())
  t.is(consoleError.firstCall.args[0].message, 'Beep boop, out of space')

  consoleError.restore()
  warn.restore()
})

test('middleware - should allow setting custom onError handler', async t => {
  const handledError = future<Error>()
  const store = { getState: sinon.spy(), dispatch: sinon.stub() }
  const next = sinon.stub()
  const action = { type: 'dummy' }
  const engine = {
    save: () => {
      return Promise.reject(new Error('Beep boop, out of space'))
    },
    load: sinon.stub()
  }

  const errorHandler = (e: Error) => {
    handledError.resolve(e)
  }

  createMiddleware(engine, {
    onError: errorHandler
  })(store)(next)(action)

  const err = await handledError

  t.is(store.dispatch.firstCall, null)
  t.is(err.message, 'Beep boop, out of space')
})

test('middleware - should allow setting custom transformer', async t => {
  const ready = future<boolean>()
  const store = { getState: () => ({}), dispatch: sinon.spy() }
  const next = sinon.spy()
  const action = { type: 'ALLOWED' }
  const engine = {
    save: (state: any) => {
      ready.resolve(state)
      return Promise.resolve()
    },
    load: sinon.stub()
  }

  createMiddleware(engine, {
    transform: state => {
      return { ...state, newField: true }
    }
  })(store)(next)(action)

  const receivedState: any = await ready
  t.is(receivedState.newField, true)
})
