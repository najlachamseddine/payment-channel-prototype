pragma solidity ^0.5.0;

import "./EIP20Interface.sol";

contract TreasuryPaymentChannel {

    mapping(uint256 => bool) usedNonces;
    address payable public sender;      // The account sending payments.
    address public receiver;   // The account receiving the payments.
    uint256 public expiration;  // Timeout in case the recipient does not claim a payment
    ERC20Interface linkedContract;
    string public contractIdentifier;
    uint256 public disputesCounter = 0;
    uint256 public proofsCounter = 0;
    uint256 public updatesMerkleRootCounter = 0;
    mapping (uint256 => disputeProofRequest) disputesRequests;
    bytes32 public currentMessagesMerkleRoot;
    string public currentMessagesMerkleRootStr;
    
 
    struct proofData {
    bytes32[] proofPath;
    uint256 maxTokenAmountForNonce;
    bool verified;
    bool merkleRootUpdated;
    bool isTokenAmountDifferent;
    }

    struct disputeProofRequest {    
    uint256 disputeTokenAmount;
    uint256 disputeNonce;
    address disputeFinalReceiver;
    address disputeInitialUser;
    address disputeReceiver;
    proofData proof;
    }

    event PrintNode(bytes32 node);
    event PrintRoot(bytes32 root);
    event PrintHashProofPathBefore1(bytes32 hashProofBefore1);
    event PrintHashProofPathAfter1(bytes32 hashProofAfter1);
    event PrintHashProofPathBefore2(bytes32 hashProofBefore2);
    event PrintHashProofPathAfter2(bytes32 hashProofAfter2);
    event PrintHashProofPathInit(bytes32 hashProofInit);
    event PrintHashProofPathFinal(bytes32 hashProofFinal);
    event PrintProofConcatStr(string concatProof);
    event PrintConcat1(bytes concatPacked1);
    event PrintConcat2(bytes concatPacked2);

    constructor(address tokenContractAddress, address receiverAddress, uint256 expirationTime, string memory contractByteCodeHash) public payable {    
       sender = msg.sender;
       receiver = receiverAddress;
       expiration = now + expirationTime;
       contractIdentifier = contractByteCodeHash;
       linkedContract = ERC20Interface(tokenContractAddress);
    }

    function claimPayment(uint256 tokenAmount, uint256 nonce, bytes calldata signature) external {
        require(msg.sender == receiver);
        require(now < expiration);
        if(usedNonces[nonce]){
            revert("Nonce already used for an other payment");
        }
        require(!usedNonces[nonce]);
        usedNonces[nonce] = true;
        // this recreates the message that was signed on the client
        bytes32 message = prefixed(keccak256(abi.encodePacked(receiver, tokenAmount, nonce, address(this))));
        if(recoverSigner(message, signature) != sender){
            revert("Wrong recover signer");
        }
        require(recoverSigner(message, signature) == sender);  
        linkedContract.transferFrom(sender, receiver, tokenAmount);
    }
    
    /// the sender can extend the expiration at any time
    function extend(uint256 newExpiration) external {
        require(msg.sender == sender);
        require(newExpiration > expiration);
        expiration = newExpiration;
    }

     /// if the timeout is reached without the recipient closing the channel,
    /// then the Ether is released back to the sender.
    function claimTimeout() external {
      require(msg.sender == sender);
      require(now >= expiration);
      selfdestruct(msg.sender);
    }

    /// destroy the contract and reclaim the leftover funds.
    // function kill() public {
    //     require(msg.sender == sender);
    //     selfdestruct(msg.sender);
    // }

    function splitSignature(bytes memory sig) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
        require(sig.length == 65);
        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }
        return (v, r, s);
    }


    function recoverSigner(bytes32 message, bytes memory sig) internal pure returns (address) {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }

    /// builds a prefixed hash to mimic the behavior of eth_sign.
    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }


    function requestPaymentDisputeProof(uint256 tokenAmount, uint256 nonce, address initialUserAddress, address receiverAddress, address finalReceiverAddress, bytes32 root) external {
         if(root != currentMessagesMerkleRoot){
            revert("Merkle root has been updated");
        }     
        require(root == currentMessagesMerkleRoot);
        require(msg.sender == receiver);
        require(now < expiration);
        disputeProofRequest memory currentDisputeProofRequest;
        currentDisputeProofRequest.disputeTokenAmount = tokenAmount;
        currentDisputeProofRequest.disputeNonce = nonce;
        currentDisputeProofRequest.disputeFinalReceiver = finalReceiverAddress;
        currentDisputeProofRequest.disputeInitialUser = initialUserAddress;
        currentDisputeProofRequest.disputeReceiver = receiverAddress;
        disputesRequests[disputesCounter] = currentDisputeProofRequest;
        disputesCounter++;
    }

    function sendDisputeProof(uint256 disputeId, uint256 maxTokenAmountForNonce, bytes32[] calldata proofPath, bytes32 leafMessageHash, bool rootUpdated) external {
        require(msg.sender == sender);
        if(rootUpdated){
           disputesRequests[disputeId].proof.merkleRootUpdated = true;
        }
        uint256 amount = disputesRequests[disputeId].disputeTokenAmount;
        if(maxTokenAmountForNonce < amount){
             disputesRequests[disputeId].proof.isTokenAmountDifferent = true;
        }
        bool isVerified = verifyProofPath(proofPath, currentMessagesMerkleRoot, leafMessageHash);
        disputesRequests[disputeId].proof.proofPath = proofPath;
        disputesRequests[disputeId].proof.verified = isVerified;
        proofsCounter++;
    }

   function verifyProofPath(bytes32[] memory proofPath, bytes32 root, bytes32 leaf) internal returns(bool) {
        bytes32 computedHash = leaf;
        emit PrintHashProofPathInit(computedHash);

        for(uint256 i=0; i < proofPath.length; i++) {
            bytes32 proofElement = proofPath[i];
            emit PrintNode(proofElement);

            if (computedHash <= proofElement) {
                // Hash(current computed hash + current element of the proof)
                emit PrintHashProofPathBefore1(computedHash);
                bytes memory concat = abi.encodePacked(computedHash, proofElement);
                emit PrintConcat1(concat);
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
                emit PrintHashProofPathAfter1(computedHash);
            } else {
                // Hash(current element of the proof + current computed hash)
                emit PrintHashProofPathBefore2(computedHash);
                bytes memory concat = abi.encodePacked(proofElement, computedHash);
                emit PrintConcat2(concat);
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
                emit PrintHashProofPathAfter2(computedHash);
            }
        }

        // Check if the computed hash (root) is equal to the provided root
        emit PrintRoot(root);
        emit PrintHashProofPathFinal(computedHash);
        return computedHash == root;
    }

     // sender for each new messages on the client side 
    function updateMerkleRoot(bytes32 root) external {
        require(msg.sender == sender);
        currentMessagesMerkleRoot = root;
        updatesMerkleRootCounter++;
    }

     function updateStrMerkleRoot(string calldata root) external {
        require(msg.sender == sender);
        currentMessagesMerkleRootStr = root;
    }

     function getRoot() external view returns(bytes32) {
        return this.currentMessagesMerkleRoot();
    }

    function getRootStr() external view returns(string memory) {
        return this.currentMessagesMerkleRootStr();
    }

    function getDisputeNonce(uint256 disputeId) external view returns(uint256){
        return disputesRequests[disputeId].disputeNonce;
    }

    function getDisputeTokenAmount(uint256 disputeId) external view returns(uint256){
        return disputesRequests[disputeId].disputeTokenAmount;
    }

    function getDisputeInitialUser(uint256 disputeId) external view returns(address){
        return disputesRequests[disputeId].disputeInitialUser;
    }

    function getDisputeReceiver(uint256 disputeId) external view returns(address){
        return disputesRequests[disputeId].disputeReceiver;
    }

    function getDisputeFinalReceiver(uint256 disputeId) external view returns(address){
        return disputesRequests[disputeId].disputeFinalReceiver;
    }

    function getProofPath(uint256 disputeId) external returns(string memory){
      bytes32[] memory proof = disputesRequests[disputeId].proof.proofPath;
      uint256 proofLength = proof.length;
      string memory proofConcat = "";
      for( uint256 i=0; i<proofLength; i++ ){
          emit PrintProofConcatStr(proofConcat);
          proofConcat = string(abi.encodePacked(proofConcat, proof[i]));
          emit PrintProofConcatStr(proofConcat);
      }
      return proofConcat;
    }

    function getIsVerified(uint256 disputeId) external view returns(bool){
        return disputesRequests[disputeId].proof.verified;
    }

}


