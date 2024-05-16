class UpdateMerkleRootParams {


  constructor(dltKey, newRoot, feePrice, feeLimit) {
      this.dltKey = dltKey;
      this.newRoot = newRoot;
      this.feePrice = feePrice;
      this.feeLimit = feeLimit;
  }    
}

exports.default = UpdateMerkleRootParams; 