'use strict'

const tape = require('tape')
const { FastPuffscoinService } = require('../../lib/service')
const MockServer = require('./mocks/mockserver.js')
const MockChain = require('./mocks/mockchain.js')
const BN = require('bn.js')
const { defaultLogger } = require('../../lib/logging')
defaultLogger.silent = true

tape('[Integration:FastPuffscoinService]', async (t) => {
  async function setup () {
    const server = new MockServer()
    const chain = new MockChain()
    const service = new FastPuffscoinService({
      servers: [ server ],
      lightserv: true,
      chain
    })
    await service.open()
    await server.start()
    await service.start()
    return [server, service]
  }

  async function destroy (server, service) {
    await service.stop()
    await server.stop()
  }

  t.test('should handle PWP requests', async (t) => {
    const [server, service] = await setup()
    const peer = await server.accept('peer0')
    const headers = await peer.puffs.getBlockHeaders({ block: 1, max: 2 })
    const hash = Buffer.from('a321d27cd2743617c1c1b0d7ecb607dd14febcdfca8f01b79c3f0249505ea069', 'hex')
    t.equals(headers[1].hash().toString('hex'), hash.toString('hex'), 'handled GetBlockHeaders')
    const bodies = await peer.puffs.getBlockBodies([hash])
    t.deepEquals(bodies, [[[], []]], 'handled GetBlockBodies')
    await peer.puffs.send('NewBlockHashes', [[hash, new BN(2)]])
    t.pass('handled NewBlockHashes')
    await destroy(server, service)
    t.end()
  })

  t.test('should handle LES requests', async (t) => {
    const [server, service] = await setup()
    const peer = await server.accept('peer0')
    const { headers } = await peer.les.getBlockHeaders({ block: 1, max: 2 })
    t.equals(
      headers[1].hash().toString('hex'),
      'a321d27cd2743617c1c1b0d7ecb607dd14febcdfca8f01b79c3f0249505ea069',
      'handled GetBlockHeaders'
    )
    await destroy(server, service)
    t.end()
  })
})
