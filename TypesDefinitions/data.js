

const functionsNames = {
  
  contractIdentifier: { type: "string" },
  currentMessagesMerkleRoot: { type: "bytes32" },
  currentMessagesMerkleRootStr: { type: "string"},
  disputesCounter: { type: "uint256" },
  proofsCounter: { type: "uint256"},
  getRoot: { type: "bytes32"},
  getRootStr: { type: "string"},
  getDisputeNonce: { type: "uint256"},
  getDisputeTokenAmount: { type: "uint256" },
  getDisputeInitialUser: { type: "address" },
  getDisputeReceiver: { type: "address" },
  getDisputeFinalReceiver: { type: "address" },
  getProofPath: { type: "string" },
  getIsVerified: { type: "bool" }
  
};

exports.functionsNames = functionsNames;