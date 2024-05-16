const sha256 = require('crypto-js/sha256');
const abi = require('ethereumjs-abi');
const MessageMerkleTreeParams = require('./TypesDefinitions/MessageMerkleTreeParams').default;


function isLeaf(messageObject) {
  if (!messageObject.userAddress) {
    return false;
  }
  if (!messageObject.treasuryAddress) {
    return false;
  }
  if (!messageObject.gatewayAddress) {
    return false;
  }
  if ((typeof messageObject.nonce) !== "number") {
    return false;
  }
  if ((typeof messageObject.paymentAmount) !== "number") {
    return false;
  }
  return true;
}

function computeLeafHash(messageObject) {
  let hash;
  if (isLeaf(messageObject)) {
    // hash = sha256(JSON.stringify(messageObject)).toString();
    hash = abi.soliditySHA3(["string"], [JSON.stringify(messageObject)]).toString("hex");
  }
  console.log(`computeLeafHash ${JSON.stringify(messageObject)}, ${JSON.stringify({ hash, leftChild: null, rightChild: null })}`);
  return { hash, leftChild: null, rightChild: null };
}

function sortLeafsHashes(listLeafsHashes) {
  const sortedListLeafsHashes = listLeafsHashes.sort((a, b) => { return a.hash >= b.hash } );
  return sortedListLeafsHashes;
}

function computeLeafsHashes(listMessages) {
  // const sortedListMessages = sortLeafs(listMessages);
  const leafs = listMessages.map(m => {
    console.log(`----computeLeafsHashes message: ${JSON.stringify(m)}`);
    return computeLeafHash(m);
  });
  const sortedHashes = sortLeafsHashes(leafs);
  return sortedHashes;
}

// leafs sorted by nonce and for each nonce by tokenAmount (should be incremental)
function sortLeafs(listLeafs) {
  const sortedListLeafs = listLeafs.sort((a, b) => ((a.nonce - b.nonce) || (a.paymentAmount - b.paymentAmount)));
  return sortedListLeafs;
}


function computeMerkleTree(listNodes) {
  const parents = [];
  // console.log(`listNodes ${listNodes}`);
  if (listNodes.length === 1) {
    return listNodes[0];
  } else {
    if (listNodes.length % 2 !== 0) {
      listNodes.push(listNodes[listNodes.length - 1]);
    }
    listNodes.forEach((value, index, array) => {
      if (index % 2 === 0) {
        const newNodeValue = abi.soliditySHA3(["bytes32", "bytes32"], [Buffer.from(value.hash, "hex"), Buffer.from(array[index + 1].hash, "hex")]).toString("hex");
        console.log(`newNodeValue ${newNodeValue}, ${value.hash}, ${array[index + 1].hash}`);
        parents.push({ hash: newNodeValue, leftChild: value, rightChild: array[index + 1] });
      }
    });
    return computeMerkleTree(parents);
  }
}

function getMerkleTreeListHashesLeftRight(merkleTree, hashes) {
  if (!merkleTree.leftChild && !merkleTree.rightChild) {
    hashes.push(merkleTree.hash);
    return hashes;
  }
  hashes.push(merkleTree.hash);
  getMerkleTreeListHashesLeftRight(merkleTree.leftChild, hashes);
  getMerkleTreeListHashesLeftRight(merkleTree.rightChild, hashes);
  return hashes;

}

function getMerkleTreeListHashesLeftCenterRight(merkleTree, hashes) {
  if (!merkleTree.leftChild && !merkleTree.rightChild) {
    hashes.push(merkleTree.hash);
    return hashes;
  }

  getMerkleTreeListHashesLeftCenterRight(merkleTree.leftChild, hashes);
  hashes.push(merkleTree.hash);
  getMerkleTreeListHashesLeftCenterRight(merkleTree.rightChild, hashes);
  return hashes;

}

function getPairNode(initHashPos, hash, orderedHashes, leafsHashes, depth) {
  // console.log(`hash ${hash}`);
  console.log(`----getPairNode leafs: ${JSON.stringify(leafsHashes)}`);
  const hashPos = orderedHashes.indexOf(hash.toString());
  // console.log(`hashPos ${hashPos}`);
  if (initHashPos === 0) {
    return hash;
  }
  if (leafsHashes.includes(hash.toString())) {
    if (!leafsHashes.includes(orderedHashes[initHashPos - 1])) {
      console.log(`include ${hash} in leafs ,depth ${depth}`);
      return orderedHashes[initHashPos + computePosPair(depth) + 1];
    } else {
      return orderedHashes[initHashPos - computePosPair(depth) - 1];
    }
  }
  const nextHash = orderedHashes[hashPos + 1];
  if (nextHash) {
    return getPairNode(initHashPos, nextHash, orderedHashes, leafsHashes, depth + 1);
  }
}

function computePosPair(depth) {
  if (depth === 0) {
    return 0;
  }
  return Math.pow(2, depth) + computePosPair(depth - 1);
}

function getMerkleTreeListLeafsHashes(merkleTree, hashes) {
  if (!merkleTree.leftChild && !merkleTree.rightChild) {
    hashes.push(merkleTree.hash);
    return hashes;
  }
  getMerkleTreeListLeafsHashes(merkleTree.leftChild, hashes);
  getMerkleTreeListLeafsHashes(merkleTree.rightChild, hashes);
  return hashes;
}

function getNodesPath(merkleTree, hash, path) {
  console.log(`hash ${hash}`);
  if (hash === merkleTree.hash) {
    return path;
  }
  const orderedHashes = getMerkleTreeListHashesLeftRight(merkleTree, []);
  console.log(`orderedHashesLR ${JSON.stringify(orderedHashes)}`);
  const leafsHashes = getMerkleTreeListLeafsHashes(merkleTree, []);
  console.log(`leafsHashes ${JSON.stringify(leafsHashes)}`);
  const hashExists = orderedHashes.includes(hash.toString());
  console.log(`hashExists ${hash}, ${hashExists}`);
  if (hashExists) {
    const hashPos = orderedHashes.indexOf(hash.toString()); 
    let pair = getPairNode(hashPos, hash, orderedHashes, leafsHashes, 0);
    path.push(pair);
    const pairPos = orderedHashes.indexOf(pair.toString());
    console.log(`hash ${hash}, pair ${pair}`);
    console.log(`path ${JSON.stringify(path)}`);
    console.log(`pairPos ${pairPos}, hashPos ${hashPos}`);
    // hash > pair test instead ????
    const newHash = hash <= pair
                    ? abi.soliditySHA3(["bytes32", "bytes32"], [Buffer.from(hash, "hex"), Buffer.from(pair, "hex")]) 
                    : abi.soliditySHA3(["bytes32", "bytes32"], [Buffer.from(pair, "hex"), Buffer.from(hash, "hex")]);

    return getNodesPath(merkleTree, newHash.toString("hex"), path);
  } else {
    return [];
  }
}

function getMerkleTreeLeaf(merkleTree, messageObject) {
  const messageHash = sha256(JSON.stringify(messageObject));
  const leafsHashes = getMerkleTreeListLeafsHashes(merkleTree, []);
  const leafExists = leafsHashes.includes(messageHash.toString());
  if (leafExists) {
    return leafsHashes.indexOf(messageHash.toString());
  }
  return -1;
}

// async function computeMerkleProof(leaf, treeHashes, path) {
//   if(!leaf.leftChild && !leaf.rightChild){

//   } else {

//   }

// }

function runExample() {
  const listMessages = new Array(
    new MessageMerkleTreeParams("0x7e0A65af0Dae83870Ce812F34C3A3D8626530d10", "0x105360Ba21773A9175A8daba66CA6C7654F7A3f2", "0x2c8251052663244f37BAc7Bde1C6Cb02bBffff93", 1, 4),
    new MessageMerkleTreeParams("0x7e0A65af0Dae83870Ce812F34C3A3D8626530d10", "0x105360Ba21773A9175A8daba66CA6C7654F7A3f2", "0x2c8251052663244f37BAc7Bde1C6Cb02bBffff93", 1, 2),
    new MessageMerkleTreeParams("0x7e0A65af0Dae83870Ce812F34C3A3D8626530d10", "0x105360Ba21773A9175A8daba66CA6C7654F7A3f2", "0x2c8251052663244f37BAc7Bde1C6Cb02bBffff93", 1, 3),
    new MessageMerkleTreeParams("0x7e0A65af0Dae83870Ce812F34C3A3D8626530d10", "0x105360Ba21773A9175A8daba66CA6C7654F7A3f2", "0x2c8251052663244f37BAc7Bde1C6Cb02bBffff93", 1, 5),
    new MessageMerkleTreeParams("0x7e0A65af0Dae83870Ce812F34C3A3D8626530d10", "0x105360Ba21773A9175A8daba66CA6C7654F7A3f2", "0x2c8251052663244f37BAc7Bde1C6Cb02bBffff93", 2, 6),
    new MessageMerkleTreeParams("0x7e0A65af0Dae83870Ce812F34C3A3D8626530d10", "0x105360Ba21773A9175A8daba66CA6C7654F7A3f2", "0x2c8251052663244f37BAc7Bde1C6Cb02bBffff93", 2, 8),
    // new MessageMerkleTreeParams("0x7e0A65af0Dae83870Ce812F34C3A3D8626530d10", "0x105360Ba21773A9175A8daba66CA6C7654F7A3f2", "0x2c8251052663244f37BAc7Bde1C6Cb02bBffff93", 2, 3),
    // new MessageMerkleTreeParams("0x7e0A65af0Dae83870Ce812F34C3A3D8626530d10", "0x105360Ba21773A9175A8daba66CA6C7654F7A3f2", "0x2c8251052663244f37BAc7Bde1C6Cb02bBffff93", 3, 5),
    // new MessageMerkleTreeParams("0x7e0A65af0Dae83870Ce812F34C3A3D8626530d10", "0x105360Ba21773A9175A8daba66CA6C7654F7A3f2", "0x2c8251052663244f37BAc7Bde1C6Cb02bBffff93", 4, 2)
  );
  // console.log(`listMessages ${JSON.stringify(listMessages)}, ${Array.isArray(listMessages)}`);
  const leafsHashes = computeLeafsHashes(listMessages);
  console.log(`leafsHashes ${JSON.stringify(leafsHashes)}`);
  const merkleTree = computeMerkleTree(leafsHashes);
  const orderedHashes = getMerkleTreeListHashesLeftRight(merkleTree, []);
  console.log(`merkleTree ${JSON.stringify(merkleTree)}`);
  console.log(`orderedHashes ${JSON.stringify(orderedHashes)}`);
  const leafsHashesFromMT = getMerkleTreeListLeafsHashes(merkleTree, []);
  console.log(`---leafsHashesFromMT ${JSON.stringify(leafsHashesFromMT)}`);
  // const posLeafMT = getMerkleTreeLeaf(merkleTree, listMessages[2]);
  // console.log(`posLeafMT ${posLeafMT}`);
  const pos = orderedHashes.indexOf("d18cb16140232b1fd528b317932f796ddce1c39487ead13690cfada0244f7f7f");
  console.log(`pos ${pos}`);
  const pair = getPairNode(pos, "d18cb16140232b1fd528b317932f796ddce1c39487ead13690cfada0244f7f7f", orderedHashes, leafsHashesFromMT, 0);
  console.log(`getPair ${pair}`)
  const getPath = getNodesPath(merkleTree, "553cdb1c2d03e0ba277fedd0281064921d3b3274de663150a0761ffc2f6ca3a5", []);
  console.log(`getPath ${JSON.stringify(getPath)}`);
}

// runExample();

function a2hex(str) {
  var arr = [];
  for (var i = 0, l = str.length; i < l; i ++) {
    var hex = Number(str.charCodeAt(i)).toString(16);
    arr.push(hex);
  }
  return arr.join('');
}

// > Buffer.from("b08ccab298e1c38add4452df0cc5d09c9780c6518262a19a40f4e032381136b9", "hex").toString('base64');
// > Buffer.from('sIzKspjhw4rdRFLfDMXQnJeAxlGCYqGaQPTgMjgRNrk=', 'base64');
// <Buffer b0 8c ca b2 98 e1 c3 8a dd 44 52 df 0c c5 d0 9c 97 80 c6 51 82 62 a1 9a 40 f4 e0 32 38 11 36 b9>




// async function verifyMerkleProof() {

// }

// newNodeValue 217850d847e1cc481ccd7cfba69315c7cdb6b87f646af78857db02c8f7aa22be, 
// 0ee893dd6769cde7bd62a3c74173a2d0c178bc21930a032632b6641d5785db25, 

// df269bdb941dc839566284105c7867db598159834961dc422833284455698520
// df269bdb941dc839566284105c7867db598159834961dc422833284455698520

exports.computeLeafsHashes = computeLeafsHashes;
exports.computeLeafHash = computeLeafHash;
exports.computeMerkleTree = computeMerkleTree;
exports.getNodesPath = getNodesPath;