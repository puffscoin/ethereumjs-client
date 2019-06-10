# SYNOPSIS


This is the work repository for the PuffscoinJS main chain client implementation project.

See [Technical Guidelines](#technical-guidelines) if
you directly want to dive into development info.

Current development stage: ``CONCEPT ANALYSIS / EARLY DEVELOPMENT``

# PROJECT SUMMARY

For a summary of the project focus, some outline of a roadmap and information on the
team and how to contribute/join see [this document](./PROJECT.md).

# TECHNICAL GUIDELINES

## Client Setup

**Installing the Client**

```shell
npm install -g puffscoinjs-client
```

**Running the Client**

Some building blocks for the client have already been implemented or outlined to further build upon.

You can run the current state of the client with:

```shell
puffscoinjs --network=mainnet [--loglevel=debug]
```

Or show the help with
```shell
puffscoinjs --help
```

If you want to have verbose logging output for the p2p communication you can use...

```shell
DEBUG=*,-babel [CLIENT_START_COMMAND]
```

for all output or something more targeted by listing the loggers like

```shell
DEBUG=devp2p:rlpx,devp2p:puffs,-babel [CLIENT_START_COMMAND]
```

**Example 1: Light sync**

In this example, we will run two puffscoinjs-clients. The first will be a fast sync client that
will connect to the network and start downloading the blockchain. The second will be a
light client that connects to the first client and syncs headers as they are downloaded.

The first client will use RLPx to connect to the network, but will also provide a libp2p
listener. The second client will use libp2p to connect to the first client.

Run the first client and start downloading blocks:
```
puffscoinjs --syncmode fast --lightserv true  --datadir first --network 420 --transports rlpx libp2p:multiaddrs=/ip4/127.0.0.1/tcp/50505/ws
```

Output:
<pre>
...
INFO [10-24|11:42:26] Listener up transport=rlpx url=enode://1c3a3d70e9fb7c274355b7ffbbb34465576ecec7ab275947fd4bdc7ddcd19320dfb61b210cbacc0702011aea6971204d4309cf9cc1856fce4887145962281907@[::]:31313
INFO [10-24|11:37:48] Listener up transport=libp2p url=<b>/ip4/127.0.0.1/tcp/50505/ws/ipfs/QmYAuYxw6QX1x5aafs6g3bUrPbMDifP5pDun3N9zbVLpEa</b>
...
</pre>

Copy the libp2p URL from the output. In this example, the url is ``/ip4/127.0.0.1/tcp/50505/ws/ipfs/QmYAuYxw6QX1x5aafs6g3bUrPbMDifP5pDun3N9zbVLpEa`` but it will be different in your case.

Wait until a few blocks are downloaded and then run the second client in a new terminal, using the url above to connect to the first client:
<pre>
puffscoinjs --syncmode light --network 420 --datadir second --transports libp2p:multiaddrs=/ip4/0.0.0.0/tcp/50506,bootnodes=<b>/ip4/127.0.0.1/tcp/50505/ws/ipfs/QmYAuYxw6QX1x5aafs6g3bUrPbMDifP5pDun3N9zbVLpEa</b>
</pre>

Notice that we have to run the second client on port 50506 using the ``multiaddrs=/ip4/0.0.0.0/tcp/50506`` libp2p option to avoid port conflicts.

**Example 2: Light sync from within a browser**

In this example, we will again perform a light sync by connecting to the first client from above. However, this time we will connect directly to the first client from within a browser window using libp2p websockets.

First, set up the browserify bundle:
```
git clone https://github.com/puffscoin/puffscoinjs-client
cd puffscoinjs-client
npm i
npm run build
```

This will create a new file (``dist/bundle.js``) in your source tree. Now, we will create an ``index.html`` file that loads ``dist/bundle.js`` and then serves it up on ``http://localhost:8080``.
```
echo '<script src="/dist/bundle.js"></script>' > index.html
npm i -g http-server
http-server
```

Now, open a new browser window and navigate to ``http://localhost:8080``. Open the developer console in your browser and run the following command to start syncing to the first client. Again, remember to change the value of bootnodes to match the url of the first client from above:
```
puffscoinjs.run({ network: 'mainnet', syncmode: 'light', bootnodes: '/ip4/127.0.0.1/tcp/50505/ws/ipfs/QmYAuYxw6QX1x5aafs6g3bUrPbMDifP5pDun3N9zbVLpEa' })
```

That's it! Now, you should start seeing headers being downloaded to the local storage of your browser. Since IndexDB is being used, even if you close and re-open the browser window, the headers you'll already downloaded will be saved.

## API

[API Reference](./docs/API.md)

## Environment / Ecosystem

**puffscoinjs Ecosystem**

This project will be embedded in the PuffscoinJS ecosystem and many submodules already exist and
can be used within the project, have a look e.g. at [puffscoinjs-block](https://github.com/puffscoin/puffscoinjs-block), [puffscoinjs-vm](https://github.com/puffscoin/puffscoinjs-vm), the
[merkle-patricia-tree](https://github.com/puffscoin/merkle-patricia-tree) or the
[puffscoinjs-devp2p](https://github.com/puffscion/puffscoinjs-devp2p) implementations.

To play well together within a client context, many sub module libraries need enhancements,
e.g. to create a common logging context. There are also larger building blocks still
missing, e.g. the [Node Discovery V5](https://github.com/puffscoin/puffscoinjs-devp2p/issues/19)
p2p implementation being necessary for a proper working light client sync. Due to the distributed
nature of PuffscoinJS there will be internal (to be done in this repo) and external issues
(to be done in other PuffscoinJS repos) to be worked on.

All issues referring to the client implementation will be provided with a
``puffscoinjs-client`` label which should be discoverable with a label search on GitHub:

- [Show external issues](https://github.com/search?utf8=%E2%9C%93&q=org%3Apuffscoin+label%3Apuffscoinjs-client&type=Issues&ref=advsearch&l=&l=)

**Basic Environment**

For library development the following basic environment is targeted. Some base requirements
like the testing tool arise from the need of maintaining a somewhat unified PuffscoinJS environment
where developers can switch between with some ease without the need to learn (too much) new
tooling.

- ``Node.js``
- ``Javascript`` (ES6)
- [Tape](https://github.com/substack/tape) for testing
- [Istanbul/nyc](https://istanbul.js.org/) for test coverage
- [standard.js](https://standardjs.com/) for linting/code formatting

## Design

The current design tries to achieves the goals of loose coupling and ease of testing by using an
event-driven architecture where possible. Readability is improved by using features of JavaScript
ES6 such as classes, async/await, promises, arrow functions, for...of, template literals and
destructuring assignment among others. Shorter names are used when possible and long functions are
broken up into smaller helpers, along with JSDoc annotations for most methods and parameters.
Documentation is auto-generated from JSDoc comments and many examples of usage are provided (TO DO).

We will now briefly describe the directory structure and main components of the PuffscoinJS client
to help contributors better understand how the project is organized.

**Directory structure**

- ``/bin`` Contains the CLI script for the ``puffscoinjs`` command
- ``/docs`` Contains auto-generated API docs as well as other supporting documentation
- ``/lib/blockchain`` Contains the ``Chain`` class.
- ``/lib/net`` Contains all of the network layer classes including ``Peer``, ``Protocol`` and its subclasses,
  ``Server`` and its subclasses, and ``PeerPool``.
- ``/lib/service`` Contains the main PUFFScoin services (``FastPuffscoinService`` and ``LightPuffscoinService``)
- ``/lib/rpc`` Contains the RPC server (optionally) embedded in the client.
- ``/lib/sync`` Contains the various chain synchronizers and ``Fetcher`` helpers.
- ``/tests`` Contains test cases, testing helper functions, mocks and test data

**Components**

- ``Chain`` [**In Progress**] This class represents the blockchain and is a wrapper around
``puffscoinjs-blockchain``. It handles creation of the data directory, provides basic blockchain operations
and maintains an updated current state of the blockchain, including current height, total difficulty, and
latest block.
- ``Server`` This class represents a server that discovers new peers and handles incoming and dropped
connections. When a new peer connects, the ``Server`` class will negotiate protocols and emit a ``connected``
event with a new ``Peer``instance. The peer will have properties corresponding to each protocol. For example,
if a new peer understands the ``puffs`` protocol, it will contain a ``puffs`` property that provides all ``puffs``
protocol methods (for example: ``peer.puffs.getBlockHeaders()``)
    - ``RlpxServer`` [**In Progress**] Subclass of ``Server`` that implements the ``devp2p/rlpx`` transport.
    - ``Libp2pServer`` [**In Progress**] Subclass of ``Server`` that implements the ``libp2p`` transport.
- ``Peer`` Represents a network peer. Instances of ``Peer`` are generated by the ``Server``
subclasses and contain instances of supported protocol classes as properties. Instances of ``Peer`` subclasses can also be used to directly connect to other nodes via the ``connect()`` method. Peers emit ``message`` events
whenever a new message is received using any of the supported protocols.
    - ``RlpxPeer`` [**In Progress**] Subclass of ``Peer`` that implements the ``devp2p/rlpx`` transport.
    - ``Libp2pPeer`` [**In Progress**] Subclass of ``Peer`` that implements the ``libp2p`` transport.
- ``Protocol`` [**In Progress**] This class and subclasses provide a user-friendly wrapper around the
low level PUFFScoin protocols such as ``puffs/62``, ``puffs/63`` and ``les/2``. Subclasses must define the messages provided by the protocol.
    - ``PuffsProtocol`` [**In Progress**] Implements the ``puffs/62`` and ``puffs/63`` protocols.
    - ``LesProtocol`` [**In Progress**] Implements the ``les/2`` protocol.
    - ``ShhProtocol`` [**Not Started**] Implements the whisper protocol.
- ``PeerPool`` [**In Progress**] Represents a pool of network peers. ``PeerPool`` instances emit ``added``
and ``removed`` events when new peers are added and removed and also emit the ``message`` event whenever
any of the peers in the pool emit a message. Each ``Service`` has an associated ``PeerPool`` and they are used primarily by ``Synchronizer``s to help with blockchain synchronization.
- ``Synchronizer`` Subclasses of this class implements a specific blockchain synchronization strategy. They
also make use of subclasses of the ``Fetcher`` class that help fetch headers and bodies from pool peers. The fetchers internally make use of streams to handle things like queuing and backpressure.
    - ``FastSynchronizer`` [**In Progress**] Implements fast syncing of the blockchain
    - ``LightSynchronizer`` [**In Progress**] Implements light syncing of the blockchain
- ``Handler`` Subclasses of this class implements a protocol message handler. Handlers respond to incoming requests from peers.
    - ``PuffsHandler`` [**In Progress**] Handles incoming PWP UPUFFScoin Wire Protocol) requests
    - ``LesHandler`` [**In Progress**] Handles incoming LES requests
- ``Service`` Subclasses of ``Service`` will implement specific functionality of a ``Node``. For example, the ``PuffscoinService`` subclasses will synchronize the blockchain using the fast or light sync protocols. Each service must specify which protocols it needs and define a ``start()`` and ``stop()`` function.
    - ``FastPuffscoinService`` [**In Progress**] Implementation of puffscoin fast sync.
    - ``LightPuffscoinService`` [**In Progress**] Implementation of puffscoin light sync.
    - ``WhisperService`` [**Not Started**] Implementation of a PUFFScoin whisper node.    
- ``Node`` [**In Progress**] Represents the top-level PUFFScoin node, and is responsible for managing the lifecycle of included services.
- ``RPCManager`` [**In Progress**] Implements an embedded JSON-RPC server to handle incoming RPC requests.

## PuffscoinJS

See our organizational [documentation](http://puffscoin.leafycauldronapothecary.com/puffwiki/puffscoinjs-user-guide/) for an introduction to `PuffscoinJS`.
