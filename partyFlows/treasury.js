
const request = require('request-promise-native');
const ClaimedPaymentParams = require('../TypesDefinitions/ClaimedPaymentParams').default;
const DltKey = require('../TypesDefinitions/DltKey').default;
// const DltNameOptions = require('@quantnetwork/overledger-types').DltNameOptions;
const DltNameOptions = require('../../overledger-sdk-javascript/packages/overledger-types/dist/associatedEnums/DltNameOptions').DltNameOptions;
const RequestPaymentProofParams = require('../TypesDefinitions/RequestPaymentProofParams').default;
const RequestParamValue = require('../TypesDefinitions/RequestParamValue').default;
const ReadParams = require('../TypesDefinitions/ReadParams').default;

const treasuryPaymentChannelUrl = "http://localhost:4000";

const ethPrivateKey = "0x3FF22F5B016E967FFF2999254FB91691331E7B6130D12ED3B69B69873B330853";
const ethAddress = "0x105360Ba21773A9175A8daba66CA6C7654F7A3f2"; // najla MM account Party B
const ethDltKey = new DltKey(DltNameOptions.ETHEREUM, ethAddress, ethPrivateKey);
// const senderSignature = "0x40b10babeada72342cd024fbc2d85e5dfe530bd93f7c87637fa0fab7be8968281784fb07c008241c3679877aab64d732bf174c1f719285b4216b245dddecb8cd1c";
// const nonce = 5;
// const claimedPayment = new ClaimedPaymentParams(ethDltKey, tokensAmountToClaim, nonce, senderSignature, '13000000000', '4397098');
const tokenAmount = 2;
const decimals = 18;
const tokensAmountToClaim = tokenAmount * Math.pow(10, decimals);


/*
 * Set the arguments nonce and the signature received from the sender in the node command line
 * node partyFlows/receiver.js claimOnePayment 0 0x231a26c8e8f34c444dfbb376cfb4060a57b81323847487a9703e777615504bf876e9f5fd2bc91a42b368ea6e6c60fbcf0009e8fc02098677e0f5c1685271ba031c
 * 
 */
const functionToRun = process.argv[2];
const senderNonce = process.argv[3];
const senderSignature = process.argv[4];
eval(functionToRun + '(\"' + senderSignature + '\", ' + senderNonce + ')');


//---------------------- TREASURY AS A RECEIVER --------------------------------------------

async function claimOnePayment(signature, nonce) {
  // ****** Claim a payment by passing the nonce and the signature received off chain from the owner of the payment channel ******
  console.log(`signature ${signature} nonce ${nonce}`);
  const claimedPayment = new ClaimedPaymentParams(ethDltKey, tokensAmountToClaim, nonce, signature, '13000000000', '4397098');
  let paymentHash = await claimPayment(claimedPayment);
  console.log(`paymentHash ${JSON.stringify(paymentHash)}`);

}

async function requestProof() {
  const paramValueParamsDisputes = new RequestParamValue(ethDltKey, "disputesCounter");
  console.log(`paramValueParamsDisputes ${JSON.stringify(paramValueParamsDisputes)}`);
  const disputesCounter = await readParamValue(paramValueParamsDisputes);
  console.log(`disputesCounter ${disputesCounter}`);
  const paramValueParamsProofs = new RequestParamValue(ethDltKey, "proofsCounter");
  const proofsCounter = await readParamValue(paramValueParamsProofs);
  console.log(`proofsCounter ${proofsCounter}`);
  const tokens = 2;
  const decimals = 18;
  const tokenAmount = tokens * Math.pow(10, decimals);
  const nonce = 2;
  const initialUser = "0x7e0A65af0Dae83870Ce812F34C3A3D8626530d10"; // user
  const receiver = ethAddress;
  const finalReceiver = "0x2c8251052663244f37BAc7Bde1C6Cb02bBffff93"; // gateway
  const paramValueParamsMerkleRoot = new RequestParamValue(ethDltKey, "currentMessagesMerkleRoot");
  // CHECK IF updatesMerkleRootCounter ???
  let merkleRoot = await readParamValue(paramValueParamsMerkleRoot); // should be read from the smart contract
  console.log(`merkleRoot ${merkleRoot}`);
  const merkleRootStr = await readParamValue(new RequestParamValue(ethDltKey, "currentMessagesMerkleRootStr"));
  console.log(`merkleRoot2 ${merkleRootStr}`);
  const requestedPaymentProof = new RequestPaymentProofParams(ethDltKey, tokenAmount, nonce, initialUser, receiver, finalReceiver, "0x" + merkleRootStr, '13000000000', '4397098');
  console.log(`requestedPaymentProof ${JSON.stringify(requestedPaymentProof)}`);
  let requestProofHash = await requestPaymentProof(requestedPaymentProof);
  console.log(`requestProofHash ${JSON.stringify(requestProofHash)}`);

  // let newProofsCounter = proofsCounter;
  // while (newProofsCounter == proofsCounter) {
  //   newProofsCounter = await readParamValue(paramValueParamsProofs);
  // }
  // console.log(`newProofsCounter ${newProofsCounter}`);
  // if(newProofsCounter > proofsCounter){
      // verification of the path for the current merkle root
      // if updated read again
      merkleRoot = await readParamValue(paramValueParamsMerkleRoot);
      // ERROR WHEN PATH =[] ???
      const proofPath = await readData(new ReadParams(ethDltKey, 0, "getProofPath", '13000000000', '4397098'));
      const isVerifedProofPath = await readData(new ReadParams(ethDltKey, 0, "getIsVerified", '13000000000', '4397098'));
      // USE BUFFER FROM
      console.log(`proofPath ${JSON.stringify(proofPath)}`);
      console.log(`isVerifedProofPath ${JSON.stringify(isVerifedProofPath)}`);
      // verify the path is correct
      // verifyPath(merkleRoot, proofPath );
// }

}

async function claimPayment(claimedPaymentParams) {
  console.log("****RECEIVER: CLAIM A PAYMENT****");
  const options = {
    uri: new URL("ClaimPayment", treasuryPaymentChannelUrl).href,
    body: claimedPaymentParams,
    json: true
  }
  const resp = await request.post(options);
  return resp;
}

async function requestPaymentProof(requestedPaymentProofParams) {
  console.log("****RECEIVER: REQUEST PAYMENT PROOF FOR DISPUTE****");
  const options = {
    uri: new URL("RequestPaymentProof", treasuryPaymentChannelUrl).href,
    body: requestedPaymentProofParams,
    json: true
  }
  const resp = await request.post(options);
  return resp;
}

async function readData(readDataParams) {
  console.log("****Read-Data****");
  const options = {
    uri: new URL("getData", treasuryPaymentChannelUrl).href,
    body: readDataParams,
    json: true
  }
  const resp = await request.post(options);
  return resp;
}


async function readParamValue(requestParamValueParams) {
  console.log("****Read-Parameter-value****");
  const options = {
    uri: new URL("readParamValue", treasuryPaymentChannelUrl).href,
    body: requestParamValueParams,
    json: true
  }
  const resp = await request.post(options);
  return resp;
}

//---------------------- TREASURY AS A SENDER --------------------------------------------