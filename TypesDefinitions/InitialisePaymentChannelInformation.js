class InitialisePaymentChannelInformation {


  constructor(redeploy, functionParameters, feePrice, feeLimit) {
      this.redeploy = redeploy;
      this.functionParameters = functionParameters;
      this.feePrice = feePrice;
      this.feeLimit = feeLimit;      
  }    
}

exports.default = InitialisePaymentChannelInformation;