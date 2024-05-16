class MessageMerkleTreeParams {


  constructor( userAddress, treasuryAddress, gatewayAddress, nonce, paymentAmount ) {
      this.userAddress = userAddress;     
      this.treasuryAddress = treasuryAddress;
      this.gatewayAddress = gatewayAddress;
      this.nonce = nonce;
      this.paymentAmount = paymentAmount;
      
  }    
}

exports.default = MessageMerkleTreeParams;