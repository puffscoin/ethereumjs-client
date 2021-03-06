const test = require('tape')

const request = require('supertest')
const { startRPC, closeRPC, createManager, createNode } = require('../helpers')

test('call net_peerCount', t => {
  const manager = createManager(createNode({ opened: true }))
  const server = startRPC(manager.getMethods())

  const req = {
    jsonrpc: '2.0',
    method: 'net_peerCount',
    params: [],
    id: 1
  }

  request(server)
    .post('/')
    .set('Content-Type', 'application/json')
    .send(req)
    .expect(200)
    .expect(res => {
      const { result } = res.body
      if (result.substring(0, 2) !== '0x') {
        throw new Error('Result should be a hex number, but is not')
      }
    })
    .end((err, res) => {
      closeRPC(server)
      t.end(err)
    })
})
