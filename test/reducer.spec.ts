import test from 'ava'
import sinon from 'sinon'
import { reducer, LOAD } from '../src/index'

test('reducer - should do nothing for non LOAD actions', t => {
  const spy = sinon.spy()
  const oldState = {}
  const action = { type: 'SOMETHING', payload: {} }
  reducer(spy)(oldState, action)
  t.is(spy.calledWith(oldState, action), true)
})

test('reducer - should have a default merger in place', t => {
  const spy = sinon.spy()
  const oldState = { x: 0, y: 0 }
  const action = { type: LOAD, payload: { y: 42 } }
  reducer(spy)(oldState, action)
  t.is(spy.calledWith({ x: 0, y: 42 }, action), true)
})

test('reducer - should allow me to change the merger', t => {
  const spy = sinon.spy()
  const oldState = { x: 0, y: 0 }
  const action = { type: LOAD, payload: { y: 42 } }

  const merger = (a, b) => {
    t.is(a, oldState)
    t.deepEqual(b, { y: 42 })
    return { c: 1 }
  }

  reducer(spy, merger)(oldState, action)
  t.is(spy.calledWith({ c: 1 }, action), true)
})
