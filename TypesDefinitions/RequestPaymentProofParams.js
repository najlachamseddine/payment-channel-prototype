class RequestPaymentProofParams {


  constructor( dltKey, erc20TokenAmount, nonce, initialUserAddress, receiverAddress, finalReceiverAddress, merkleRoot, feePrice, feeLimit ) {
      this.dltKey = dltKey;
      this.erc20TokenAmount = erc20TokenAmount;
      this.nonce = nonce;
      this.initialUserAddress = initialUserAddress;
      this.receiverAddress = receiverAddress;
      this.finalReceiverAddress = finalReceiverAddress;
      this.merkleRoot = merkleRoot;     
      this.feePrice = feePrice;
      this.feeLimit = feeLimit;
      
  }    
}

exports.default = RequestPaymentProofParams;