class SendDisputeProofParams {


  constructor( dltKey, disputeId, maxTokenAmountForNonce, proofPath, messageHash, isRootUpdated, feePrice, feeLimit) {
      this.dltKey = dltKey;
      this.disputeId = disputeId;
      this.maxTokenAmountForNonce = maxTokenAmountForNonce;
      this.proofPath = proofPath;
      this.messageHash = messageHash;
      this.isRootUpdated = isRootUpdated;     
      this.feePrice = feePrice;
      this.feeLimit = feeLimit;     
  }    
}

exports.default = SendDisputeProofParams;