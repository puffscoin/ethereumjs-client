const tape = require('tape-catch')
const td = require('testdouble')
const EventEmitter = require('events')
const { defaultLogger } = require('../lib/logging')
defaultLogger.silent = true

tape('[Node]', t => {
  class PuffscoinService extends EventEmitter {}
  PuffscoinService.prototype.open = td.func()
  PuffscoinService.prototype.start = td.func()
  PuffscoinService.prototype.stop = td.func()
  td.when(PuffscoinService.prototype.open()).thenResolve()
  td.when(PuffscoinService.prototype.start()).thenResolve()
  td.when(PuffscoinService.prototype.stop()).thenResolve()
  td.replace('../lib/service', { PuffscoinService })
  class Server extends EventEmitter {}
  Server.prototype.open = td.func()
  Server.prototype.start = td.func()
  Server.prototype.stop = td.func()
  td.when(Server.prototype.start()).thenResolve()
  td.when(Server.prototype.stop()).thenResolve()
  td.replace('../lib/net/server/server', Server)
  const Node = require('../lib/node')

  t.test('should initialize correctly', t => {
    const node = new Node()
    t.ok(node.services[0] instanceof PuffscoinService, 'added service')
    t.end()
  })

  t.test('should open', async (t) => {
    t.plan(6)
    const servers = [ new Server() ]
    const node = new Node({ servers })
    node.on('error', err => {
      if (err === 'err0') t.pass('got err0')
      if (err === 'err1') t.pass('got err1')
    })
    node.on('listening', details => t.equals(details, 'details0', 'got listening'))
    node.on('synchronized', () => t.ok('got synchronized'))
    await node.open()
    servers[0].emit('error', 'err0')
    servers[0].emit('listening', 'details0')
    node.services[0].emit('error', 'err1')
    node.services[0].emit('synchronized')
    t.ok(node.opened, 'opened')
    t.equals(await node.open(), false, 'already opened')
  })

  t.test('should start/stop', async (t) => {
    const servers = [ new Server() ]
    const node = new Node({ servers })
    await node.start()
    t.ok(node.started, 'started')
    t.equals(await node.start(), false, 'already started')
    await node.stop()
    t.notOk(node.started, 'stopped')
    t.equals(await node.stop(), false, 'already stopped')
    t.end()
  })

  t.test('should reset td', t => {
    td.reset()
    t.end()
  })
})
