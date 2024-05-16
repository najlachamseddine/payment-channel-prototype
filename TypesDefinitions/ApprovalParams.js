class ApprovalParams {


  constructor(dltKey, erc20ContractAddress, receiver, amount, feePrice, feeLimit ) {
      this.dltKey = dltKey;     
      this.erc20ContractAddress = erc20ContractAddress;
      this.receiver = receiver;
      this.amount = amount;
      this.feePrice = feePrice;
      this.feeLimit = feeLimit;
  }    
}

exports.default = ApprovalParams; 