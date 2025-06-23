import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { bootstrap } from "@libp2p/bootstrap";
import { floodsub } from "@libp2p/floodsub";
import { identify } from "@libp2p/identify";
import { kadDHT } from "@libp2p/kad-dht";
// import { kadDHT, removePublicAddressesMapper } from "@libp2p/kad-dht";
import { ping } from "@libp2p/ping";
import { webRTCDirect } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import { Buffer } from "buffer";
import { createLibp2p } from "libp2p";

window.Buffer = Buffer;

async function createNode(options) {
  return await createLibp2p({
    ...options,
    streamMuxers: [yamux()],
    connectionEncrypters: [noise()],
    services: {
      identify: identify(),
      ping: ping(),
      dht: kadDHT({
        clientMode: false,
        protocol: "/ipfs/lan/kad/1.0.0",
        peerInfoMapper: peer => {
          console.log(peer);
          return peer;
        }
        // peerInfoMapper: removePublicAddressesMapper
      }),
      pubsub: floodsub()
    }
  });
}

export async function startServer() {
  const node = await createNode({
    transports: [webSockets(), webRTCDirect()],
    peerDiscovery: [
      bootstrap({
        list: [
          "/dns4/libp2p-bootstrap.robonomics.network/tcp/443/wss/p2p/12D3KooWRdvHvy3Co6BiVkceuFhJttPhoy5aG8KcvT2Zeu2f4zm3"
        ]
      })
    ],
    connectionGater: {
      denyDialMultiaddr: () => false
    }
  });
  await node.start();
  console.log("Node started with ID:", node.peerId.toString());
  console.log(
    "Node listening on:",
    node.getMultiaddrs().map(addr => addr.toString())
  );
  node.addEventListener("peer:connect", () => {
    setTimeout(() => {
      console.log("PEERS ON NODE:", node.getPeers());
    }, 3000);
  });

  node.services.pubsub.subscribe("topic-pubsub");
  node.services.pubsub.addEventListener("message", msg => {
    console.log(msg.type);
    const sender = msg.detail.from.toString();
    console.log(sender);
    console.log(Buffer.from(msg.detail.data).toString("utf8"));
    console.log(`=======================`);
  });
}
