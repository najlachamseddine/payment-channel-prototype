class ClaimedPaymentParams {


  constructor(dltKey, erc20TokenAmount, nonce, signature, feePrice, feeLimit ) {
      this.dltKey = dltKey;     
      this.erc20TokenAmount = erc20TokenAmount;
      this.nonce = nonce;
      this.signature = signature;
      this.feePrice = feePrice;
      this.feeLimit = feeLimit;
  }    
}

exports.default = ClaimedPaymentParams; 