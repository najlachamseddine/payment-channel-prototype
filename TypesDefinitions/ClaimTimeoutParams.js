class ClaimTimeoutParams {


  constructor(dltKey, feePrice, feeLimit ) {
      this.dltKey = dltKey;     
      this.feePrice = feePrice;
      this.feeLimit = feeLimit;
  }    
}

exports.default = ClaimTimeoutParams; 