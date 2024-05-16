// const OverledgerSDK = require('@quantnetwork/overledger-bundle').default;
const OverledgerSDK = require('../overledger-sdk-javascript/packages/overledger-bundle/dist').default;
const util = require('util');
const fs = require('fs');
const readFile = util.promisify(fs.readFile);
const sha256 = require('crypto-js/sha256');
const RequestParamValue = require('./TypesDefinitions/RequestParamValue').default;
const functionsNames = require('./TypesDefinitions/data').functionsNames;
// const SCFunctionTypeOptions = require('@quantnetwork/overledger-types').SCFunctionTypeOptions;
// const EthereumTypeOptions = require('@quantnetwork/overledger-dlt-ethereum').EthereumTypeOptions;
// const EthereumUintIntOptions = require('@quantnetwork/overledger-dlt-ethereum').EthereumUintIntOptions;
// const EthereumBytesOptions = require('@quantnetwork/overledger-dlt-ethereum').EthereumBytesOptions;
// const DltNameOptions = require('@quantnetwork/overledger-types').DltNameOptions;
// const TransactionTypeOptions = require('@quantnetwork/overledger-types').TransactionTypeOptions;
// const TransactionEthereumSubTypeOptions = require('@quantnetwork/overledger-dlt-ethereum').TransactionEthereumSubTypeOptions;


const SCFunctionTypeOptions = require('../overledger-sdk-javascript/packages/overledger-types/dist/associatedEnums/SCFunctionTypeOptions').SCFunctionTypeOptions;
const EthereumTypeOptions = require('../overledger-sdk-javascript/packages/overledger-dlt-ethereum/dist/DLTSpecificTypes/associatedEnums/TypeOptions').EthereumTypeOptions;
const EthereumUintIntOptions = require('../overledger-sdk-javascript/packages/overledger-dlt-ethereum/dist/DLTSpecificTypes/associatedEnums/UintIntBOptions').EthereumUintIntOptions;
const EthereumBytesOptions = require('../overledger-sdk-javascript/packages/overledger-dlt-ethereum/dist/DLTSpecificTypes/associatedEnums/BytesBOptions').EthereumBytesOptions;
const DltNameOptions = require('../overledger-sdk-javascript/packages/overledger-types/dist/associatedEnums/DltNameOptions').DltNameOptions;
const TransactionTypeOptions = require('../overledger-sdk-javascript/packages/overledger-types/dist/associatedEnums/TransactionTypeOptions').TransactionTypeOptions;
const TransactionEthereumSubTypeOptions = require('../overledger-sdk-javascript/packages/overledger-dlt-ethereum/dist/DLTSpecificTypes/associatedEnums/TransactionEthereumSubTypeOptions').TransactionEthereumSubTypeOptions;

const abi = require('ethereumjs-abi');
const Web3 = require('web3');
const provider = new Web3.providers.HttpProvider("https://ropsten.infura.io/v3/token");

const web3 = new Web3(provider);

function validateConstructorPaymentChannelParameters(initPaymentChannelAppParams) {
  if (!initPaymentChannelAppParams.dltKey) {
    return false;
  }
  if (!initPaymentChannelAppParams.initialiseInformation) {
    return false;
  }
  if (!initPaymentChannelAppParams.initialiseInformation.functionParameters) {
    return false;
  }
  return true;
}

function validateClaimTimeoutParameters(claimTimeoutParams) {
  if (!claimTimeoutParams.dltKey) {
    return false;
  }
  return true;
}

function validateClaimPaymentParameters(claimPaymentParams) {
  if (!claimPaymentParams.dltKey) {
    return false;
  }
  if ((typeof claimPaymentParams.erc20TokenAmount) !== "number") {
    console.log(`erc20TokenAmount`);
    return false;
  }
  if ((typeof claimPaymentParams.nonce) !== "number") {
    console.log(`nonce`);
    return false;
  }
  if (!claimPaymentParams.signature) {
    console.log(`signature`);
    return false;
  }
  return true;
}


function validateTransferApprovalParameters(approvalTransferParams) {
  if (!approvalTransferParams.dltKey) {
    return false;
  }
  if (!approvalTransferParams.erc20ContractAddress) {
    return false;
  }
  if (!approvalTransferParams.receiver) {
    return false;
  }
  if ((typeof approvalTransferParams.amount) !== "number") {
    return false;
  }
  return true;
}


function validateRequestPaymentProofParameters(requestPaymentProofParams) {
  if (!requestPaymentProofParams.dltKey) {
    return false;
  }
  if ((typeof requestPaymentProofParams.erc20TokenAmount) !== "number") {
    return false;
  }
  if ((typeof requestPaymentProofParams.nonce) !== "number") {
    return false;
  }
  if (!requestPaymentProofParams.initialUserAddress) {
    return false;
  }
  if (!requestPaymentProofParams.finalReceiverAddress) {
    return false;
  }
  if (!requestPaymentProofParams.merkleRoot) {
    return false;
  }
  return true;
}

function validateDisputeProofParameters(disputeProofParams) {
  if (!disputeProofParams.dltKey) {
    return false;
  }
  if ((typeof disputeProofParams.erc20TokenAmount) !== "number") {
    return false;
  }
  if ((typeof disputeProofParams.nonce) !== "number") {
    return false;
  }
  if (!disputeProofParams.initialUserAddress) {
    return false;
  }
  if (!disputeProofParams.finalReceiverAddress) {
    return false;
  }
  if (!disputeProofParams.merkleRoot) {
    return false;
  }
  return true;
}

function validateGetDataParameters(readDataParams) {
  if (!readDataParams.dltKey) {
    return false;
  }
  if ((typeof readDataParams.id) !== "number") {
    return false;
  }
  if (!readDataParams.functionName) {
    return false;
  }
  return true;
}

function validateReadParamValueParameters(readValueParams) {
  if (!readValueParams.dltKey) {
    return false;
  }
  if (!readValueParams.paramName) {
    return false;
  }
  return true;
}

function validateUpdateMerkleRootParameters(updateMerkleRootParams) {
  if (!updateMerkleRootParams.dltKey) {
    return false;
  }
  if (!updateMerkleRootParams.newRoot) {
    return false;
  }
  return true;
}

function validateSendProofParameters(sendProofParams) {
  if (!sendProofParams.dltKey) {
    return false;
  }
  if ((typeof sendProofParams.disputeId) !== "number") {
    console.log('disputeId');
    return false;
  }
  if (!sendProofParams.proofPath) {
    console.log('proofPath');
    return false;
  }
  if (!sendProofParams.messageHash) {
    console.log('messageHash');
    return false;
  }
  if (sendProofParams.isRootUpdated === undefined) {
    console.log('isRootUpdated');
    return false;
  }
  return true;
}



/**
 * instantiates an overledger instance for the given DLTs
 * @param {*} overledgerMappId 
 * @param {*} OverledgerBpiKey 
 * @param {*} overledgerDLTs - String list of DLTs to connect to
 * @param {*} overledgerNetwork - String of "testnet" or "mainnet"
 */
async function instantiateOverledgerInstance(overledgerMappId, OverledgerBpiKey, overledgerDLTs, overledgerNetwork) {
  // console.log("***instaniateOverledgerInstance***");
  if (Array.isArray(overledgerDLTs)) {
    let count = 0;
    let dltsForRequest = [];
    while (count < overledgerDLTs.length) {
      dltsForRequest[count] = { dlt: overledgerDLTs[count] };
      count++;
    }
    // console.log("network is: + " + overledgerNetwork);
    let overledger = new OverledgerSDK(overledgerMappId, OverledgerBpiKey, { dlts: dltsForRequest, provider: { network: overledgerNetwork } });
    // console.log(`instantiateOverledgerInstance overledger ${overledger}`);
    return overledger;
  } else {
    return null;
  }
}


/**
 * Adds a dlt account via its private key
 * @param {*} overledgerSDK 
 * @param {*} overledgerDLTs 
 * @param {*} overledgerPrivateKeys 
 */
async function addAccountsToOverledger(overledgerSDK, overledgerDLTs, overledgerPrivateKeys) {

  if (Array.isArray(overledgerDLTs)) {
    let count = 0;
    while (count < overledgerDLTs.length) {
      if (overledgerSDK.dlts[overledgerDLTs[count]] != undefined) {
        const t = overledgerSDK.dlts[overledgerDLTs[count]].setAccount(overledgerPrivateKeys[count]);
        console.log(`t ${t}`);
      }
      count++;
    }
  }

  return overledgerSDK;

}

/**
 * Allows the smart contract to deploy the smart contract infrastructure
 * @param {*} constructorParams - the parameters for this deployment
 */
async function startup(overledgerSDK, constructorParams, byteCodeLocation, smartContractByteCodeHash) {
  console.log("********************FUNCTION:startup********************");
  try {
    //search for transaction with the mapp unique ID
    let mappTransactions = await overledgerSDK.readTransactionsByMappId();
    console.log(`mappTransactions ${mappTransactions}`);
    //Only allow the deployment of smart contract infrastructure if there has been no transactions deployed for this treaty contract or redeploy is set **REMOVE THIS FOR FINAL VERSION**
    if ((mappTransactions.data.totalTransactions == 0) || (constructorParams.initialiseInformation.redeploy == true)) {
      //if the MAPP/BPIKey combination has not yet been used deploy TX1: Solidity atomic swap smart contract by:
      //(a) loading the byte code
      let SolidityByteCode = await loadDataFromFile(byteCodeLocation);
      SolidityByteCode = "0x" + SolidityByteCode;
      //(b) checking this byte code matches the given hash
      let solidityHash = sha256(SolidityByteCode).toString();
      console.log("SolidityByteCodeHash: " + solidityHash);
      if (solidityHash == smartContractByteCodeHash.toString()) {
        //(c) if it does then deploy the contract (else return an error message)
        let smartContractCreationOptions = await generateSmartContractCreationOptions(overledgerSDK, constructorParams, SolidityByteCode);
        console.log(`smartContractCreationOptions ${smartContractCreationOptions}`);
        let contractCreationTx = buildDLTransaction(overledgerSDK, DltNameOptions.ETHEREUM, "", TransactionEthereumSubTypeOptions.SMART_CONTRACT_DEPLOY, "", smartContractCreationOptions);
        console.log(`contractCreationTx ${JSON.stringify(contractCreationTx)}`);
        let signedContractCreationTx = await signDLTransactions(overledgerSDK, [contractCreationTx]);
        const result = (await overledgerSDK.send(signedContractCreationTx)).data;
        const transactionHash = result.dltData[0].transactionHash;
        console.log(`===== result `, result);
        console.log(JSON.stringify(result, null, 2));
        let toReturn = {
          result: transactionHash,
          event: "newContract"
        }
        return toReturn;
      } else {
        console.log("The loaded Solidity byte code is not the same as the expected version");
        console.log("Loaded Solidity byte code hash: " + solidityHash);
        console.log("Expected Solidity byte code hash: " + smartContractByteCodeHash);
        let toReturn = {
          result: "The loaded Solidity byte code is not the same as the expected version",
          event: "SolidityHashFail"
        }
        return toReturn;
      }

    } else {
      console.log("Treaty Contract MAPP has already been created!");
      console.log("Number of MAPP transactions: " + mappTransactions.data.totalTransactions);
      //or return "already deployed: " and return TX1's receipt or info 
      let contractAddress = await getTreasuryPaymentChannelContractAddress(overledgerSDK, constructorParams.dltKey, smartContractByteCodeHash);
      let toReturn = {
        result: contractAddress,
        event: "ContractAlreadyDeployed"
      }
      return toReturn;
    }
  } catch (e) {
    console.error('error', e);
  }
}

async function generateSmartContractCreationOptions(overledgerSDK, params, smartContractByteCode) {
  console.log(`params ${JSON.stringify(params)}`);
  let functionType;
  if (params.initialiseInformation.functionParameters.length = 0) {
    functionType = SCFunctionTypeOptions.CONSTRUCTOR_WITH_NO_PARAMETERS;
  } else {
    functionType = SCFunctionTypeOptions.CONSTRUCTOR_WITH_PARAMETERS;
  }
  console.log(`functionType ${functionType}`);
  let sequenceNumResponse = await overledgerSDK.dlts.ethereum.getSequence(params.dltKey.dltAddress);//get sequenceNumber from OVL
  let sequenceNum = sequenceNumResponse.data.dltData[0].sequence;
  const constructorParams = params.initialiseInformation.functionParameters.data.map(curParams => {
    console.log(`curParams ${JSON.stringify(curParams)}`);
    if ((curParams.type == EthereumTypeOptions.UINT_B) || (curParams.type == EthereumTypeOptions.INT_B) || (curParams.type == EthereumTypeOptions.UINT_B_ARRAY) || (curParams.type == EthereumTypeOptions.INT_B_ARRAY)) {
      return {
        type: { selectedType: curParams.type, selectedIntegerLength: curParams.uintIntMValue },
        name: curParams.name,
        value: curParams.value
      };
    } else if ((curParams.type == EthereumTypeOptions.BYTES_B) || (curParams.type == EthereumTypeOptions.BYTES_B_ARRAY)) {
      return {
        type: { selectedType: curParams.type, selectedBytesLength: curParams.bytesMValue },
        name: curParams.name,
        value: curParams.value
      };
    } else {
      return {
        type: { selectedType: curParams.type },
        name: curParams.name,
        value: curParams.value
      };
    }
  });

  let options = {
    amount: '0',
    sequence: sequenceNum,
    fromAddress: params.dltKey.dltAddress,
    extraFields: {
      compUnitPrice: params.initialiseInformation.feePrice,
      compLimit: params.initialiseInformation.feeLimit
    },
    smartContract: {
      code: smartContractByteCode,
      functionCall: [{
        functionType,
        functionName: "",
        inputParams: constructorParams
      }],
      extraFields: {
        payable: false
      }
    }
  }
  return options;
}

async function claimPayment(overledgerSDK, dltKey, paymentChannelContractAddress, tokenAmount, nonce, signature, feePrice, feeLimit) {
  let sequenceNumResponse = await overledgerSDK.dlts.ethereum.getSequence(dltKey.dltAddress);
  let sequenceNum = sequenceNumResponse.data.dltData[0].sequence;
  const functionParameters = [
    {
      type: { selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256 },
      name: 'tokenAmount',
      value: tokenAmount.toString()
    },
    {
      type: { selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256 },
      name: 'nonce',
      value: nonce.toString()

    },
    {
      type: { selectedType: EthereumTypeOptions.BYTES_B, selectedBytesLength: EthereumBytesOptions.B0 },
      // type: { selectedType: EthereumTypeOptions.BYTES_B, selectedBytesLength: ""},
      // type: { selectedType: EthereumTypeOptions.STRING },
      name: 'signature',
      value: signature.toString()
    }
  ];

  let options = {
    amount: '0',
    sequence: sequenceNum,
    fromAddress: dltKey.dltAddress,
    extraFields: {
      compUnitPrice: feePrice,
      compLimit: feeLimit
    },
    smartContract: {
      functionCall: [{
        functionType: SCFunctionTypeOptions.FUNCTION_CALL_WITH_PARAMETERS,
        functionName: 'claimPayment',
        inputParams: functionParameters
      }],
      extraFields: {
        payable: false
      }
    }
  }

  let paymentChannelContractInvocationTx = buildDLTransaction(overledgerSDK, DltNameOptions.ETHEREUM, paymentChannelContractAddress, TransactionEthereumSubTypeOptions.SMART_CONTRACT_INVOCATION, "", options);
  console.log(`paymentChannelContractInvocationTx ${JSON.stringify(paymentChannelContractInvocationTx)}`);
  let signedContractInvocationTx = await signDLTransactions(overledgerSDK, [paymentChannelContractInvocationTx]);
  const result = (await overledgerSDK.send(signedContractInvocationTx)).data;
  console.log(`result ${JSON.stringify(result)}`);
  const transactionHash = result.dltData[0].transactionHash;
  return transactionHash;

}

async function requestPaymentProof(overledgerSDK, dltKey, paymentChannelContractAddress, tokenAmount, nonce, initialUser, receiver, finalReceiver, merkleRoot, feePrice, feeLimit) {

  console.log(`merkleRoot ${merkleRoot}`);
  let sequenceNumResponse = await overledgerSDK.dlts.ethereum.getSequence(dltKey.dltAddress);
  let sequenceNum = sequenceNumResponse.data.dltData[0].sequence;
  const functionParameters = [
    {
      type: { selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256 },
      name: 'tokenAmount',
      value: tokenAmount.toString()
    },
    {
      type: { selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256 },
      name: 'nonce',
      value: nonce.toString()

    },
    {
      type: { selectedType: EthereumTypeOptions.ADDRESS },
      name: 'initialUserAddress',
      value: initialUser.toString()
    },
    {
      type: { selectedType: EthereumTypeOptions.ADDRESS },
      name: 'receiverAddress',
      value: receiver.toString()
    },
    {
      type: { selectedType: EthereumTypeOptions.ADDRESS },
      name: 'finalReceiverAddress',
      value: finalReceiver.toString()
    },
    {
      type: { selectedType: EthereumTypeOptions.BYTES_B, selectedBytesLength: EthereumBytesOptions.B32 },
      name: 'root',
      value: merkleRoot.toString()
    }
  ];

  let options = {
    amount: '0',
    sequence: sequenceNum,
    fromAddress: dltKey.dltAddress,
    extraFields: {
      compUnitPrice: feePrice,
      compLimit: feeLimit
    },
    smartContract: {
      functionCall: [{
        functionType: SCFunctionTypeOptions.FUNCTION_CALL_WITH_PARAMETERS,
        functionName: 'requestPaymentDisputeProof',
        inputParams: functionParameters
      }],
      extraFields: {
        payable: false
      }
    }
  }

  console.log(`requestPaymentProof options ${JSON.stringify(options)}`);

  let paymentChannelContractInvocationTx = buildDLTransaction(overledgerSDK, DltNameOptions.ETHEREUM, paymentChannelContractAddress, TransactionEthereumSubTypeOptions.SMART_CONTRACT_INVOCATION, "", options);
  console.log(`paymentChannelContractInvocationTx ${JSON.stringify(paymentChannelContractInvocationTx)}`);
  let signedContractInvocationTx = await signDLTransactions(overledgerSDK, [paymentChannelContractInvocationTx]);
  const result = (await overledgerSDK.send(signedContractInvocationTx)).data;
  console.log(`result ${JSON.stringify(result)}`);
  const transactionHash = result.dltData[0].transactionHash;
  return transactionHash;



}

async function sendProof(overledgerSDK, dltKey, paymentChannelContractAddress, disputeId, maxTokenAmountSentForNonce, merkleTreeProofPath, leafMessageHash, merkleRootUpdated, feePrice, feeLimit) {
  let sequenceNumResponse = await overledgerSDK.dlts.ethereum.getSequence(dltKey.dltAddress);
  let sequenceNum = sequenceNumResponse.data.dltData[0].sequence;
  const functionParameters = [
    {
      type: { selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256 },
      name: 'disputeId',
      value: disputeId.toString()
    },
    {
      type: { selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256 },
      name: 'maxTokenAmountForNonce',
      value: maxTokenAmountSentForNonce.toString()
    },
    {
      type: { selectedType: EthereumTypeOptions.BYTES_B_ARRAY, selectedBytesLength: EthereumBytesOptions.B32 },
      name: 'proofPath',
      value: merkleTreeProofPath

    },
    {
      type: { selectedType: EthereumTypeOptions.BYTES_B, selectedBytesLength: EthereumBytesOptions.B32 },
      name: 'leafMessageHash',
      value: leafMessageHash.toString()
    },
    {
      type: { selectedType: EthereumTypeOptions.BOOLEAN },
      name: 'rootUpdated',
      value: merkleRootUpdated
    }
  ];

  let options = {
    amount: '0',
    sequence: sequenceNum,
    fromAddress: dltKey.dltAddress,
    extraFields: {
      compUnitPrice: feePrice,
      compLimit: feeLimit
    },
    smartContract: {
      functionCall: [{
        functionType: SCFunctionTypeOptions.FUNCTION_CALL_WITH_PARAMETERS,
        functionName: 'sendDisputeProof',
        inputParams: functionParameters
      }],
      extraFields: {
        payable: false
      }
    }
  }

  let paymentChannelContractInvocationTx = buildDLTransaction(overledgerSDK, DltNameOptions.ETHEREUM, paymentChannelContractAddress, TransactionEthereumSubTypeOptions.SMART_CONTRACT_INVOCATION, "", options);
  console.log(`paymentChannelContractInvocationTx ${JSON.stringify(paymentChannelContractInvocationTx)}`);
  let signedContractInvocationTx = await signDLTransactions(overledgerSDK, [paymentChannelContractInvocationTx]);
  const result = (await overledgerSDK.send(signedContractInvocationTx)).data;
  console.log(`result ${JSON.stringify(result)}`);
  const transactionHash = result.dltData[0].transactionHash;
  return transactionHash;



}

async function updateMerkleRoot(overledgerSDK, dltKey, paymentChannelContractAddress, newRoot, feePrice, feeLimit) {
  let sequenceNumResponse = await overledgerSDK.dlts.ethereum.getSequence(dltKey.dltAddress);
  let sequenceNum = sequenceNumResponse.data.dltData[0].sequence;
  const functionParameters = [
    {
      type: { selectedType: EthereumTypeOptions.BYTES_B, selectedBytesLength: EthereumBytesOptions.B32 },
      name: 'root',
      value: newRoot.toString()
    }
  ];

  let options = {
    amount: '0',
    sequence: sequenceNum,
    fromAddress: dltKey.dltAddress,
    extraFields: {
      compUnitPrice: feePrice,
      compLimit: feeLimit
    },
    smartContract: {
      functionCall: [{
        functionType: SCFunctionTypeOptions.FUNCTION_CALL_WITH_PARAMETERS,
        functionName: 'updateMerkleRoot',
        inputParams: functionParameters
      }],
      extraFields: {
        payable: false
      }
    }
  }

  let paymentChannelContractInvocationTx = buildDLTransaction(overledgerSDK, DltNameOptions.ETHEREUM, paymentChannelContractAddress, TransactionEthereumSubTypeOptions.SMART_CONTRACT_INVOCATION, "", options);
  console.log(`paymentChannelContractInvocationTx ${JSON.stringify(paymentChannelContractInvocationTx)}`);
  let signedContractInvocationTx = await signDLTransactions(overledgerSDK, [paymentChannelContractInvocationTx]);
  const result = (await overledgerSDK.send(signedContractInvocationTx)).data;
  console.log(`result ${JSON.stringify(result)}`);
  const transactionHash = result.dltData[0].transactionHash;
  return transactionHash;



}

async function updateStrMerkleRoot(overledgerSDK, dltKey, paymentChannelContractAddress, newRoot, feePrice, feeLimit) {
  let sequenceNumResponse = await overledgerSDK.dlts.ethereum.getSequence(dltKey.dltAddress);
  let sequenceNum = sequenceNumResponse.data.dltData[0].sequence;
  const functionParameters = [
    {
      type: { selectedType: EthereumTypeOptions.STRING },
      name: 'root',
      value: newRoot.toString()
    }
  ];

  let options = {
    amount: '0',
    sequence: sequenceNum,
    fromAddress: dltKey.dltAddress,
    extraFields: {
      compUnitPrice: feePrice,
      compLimit: feeLimit
    },
    smartContract: {
      functionCall: [{
        functionType: SCFunctionTypeOptions.FUNCTION_CALL_WITH_PARAMETERS,
        functionName: 'updateStrMerkleRoot',
        inputParams: functionParameters
      }],
      extraFields: {
        payable: false
      }
    }
  }

  let paymentChannelContractInvocationTx = buildDLTransaction(overledgerSDK, DltNameOptions.ETHEREUM, paymentChannelContractAddress, TransactionEthereumSubTypeOptions.SMART_CONTRACT_INVOCATION, "", options);
  console.log(`paymentChannelContractInvocationTx ${JSON.stringify(paymentChannelContractInvocationTx)}`);
  let signedContractInvocationTx = await signDLTransactions(overledgerSDK, [paymentChannelContractInvocationTx]);
  const result = (await overledgerSDK.send(signedContractInvocationTx)).data;
  console.log(`result ${JSON.stringify(result)}`);
  const transactionHash = result.dltData[0].transactionHash;
  return transactionHash;



}

async function claimTimeout(overledgerSDK, dltKey, paymentChannelContractAddress, feePrice, feeLimit) {
  let sequenceNumResponse = await overledgerSDK.dlts.ethereum.getSequence(dltKey.dltAddress);
  let sequenceNum = sequenceNumResponse.data.dltData[0].sequence;
  const functionParameters = [];

  let options = {
    amount: '0',
    sequence: sequenceNum,
    fromAddress: dltKey.dltAddress,
    extraFields: {
      compUnitPrice: feePrice,
      compLimit: feeLimit
    },
    smartContract: {
      functionCall: [{
        functionType: SCFunctionTypeOptions.FUNCTION_CALL_WITH_NO_PARAMETERS,
        functionName: 'claimTimeout',
        inputParams: functionParameters
      }],
      extraFields: {
        payable: false
      }
    }
  }

  let paymentChannelContractInvocationTx = buildDLTransaction(overledgerSDK, DltNameOptions.ETHEREUM, paymentChannelContractAddress, TransactionEthereumSubTypeOptions.SMART_CONTRACT_INVOCATION, "", options);
  console.log(`paymentChannelContractInvocationTx ${JSON.stringify(paymentChannelContractInvocationTx)}`);
  let signedContractInvocationTx = await signDLTransactions(overledgerSDK, [paymentChannelContractInvocationTx]);
  const result = (await overledgerSDK.send(signedContractInvocationTx)).data;
  console.log(`result ${JSON.stringify(result)}`);
  const transactionHash = result.dltData[0].transactionHash;
  return transactionHash;



}

async function tokenTranferApproval(overledgerSDK, dltKey, erc20ContractAddress, receiver, amount, feePrice, feeLimit) {
  let sequenceNumResponse = await overledgerSDK.dlts.ethereum.getSequence(dltKey.dltAddress);
  let sequenceNum = sequenceNumResponse.data.dltData[0].sequence;
  const functionParameters = [
    {
      type: { selectedType: EthereumTypeOptions.ADDRESS },
      name: 'spender',
      value: receiver
    },
    {
      type: { selectedType: EthereumTypeOptions.UINT_B, selectedIntegerLength: EthereumUintIntOptions.B256 },
      name: 'value',
      value: amount.toString()

    }
  ];

  let options = {
    amount: '0',
    sequence: sequenceNum,
    fromAddress: dltKey.dltAddress,
    extraFields: {
      compUnitPrice: feePrice,
      compLimit: feeLimit
    },
    smartContract: {
      functionCall: [{
        functionType: SCFunctionTypeOptions.FUNCTION_CALL_WITH_PARAMETERS,
        functionName: 'approve',
        inputParams: functionParameters
      }],
      extraFields: {
        payable: false
      }
    }
  }

  let erc20ContractInvocationTx = buildDLTransaction(overledgerSDK, DltNameOptions.ETHEREUM, erc20ContractAddress, TransactionEthereumSubTypeOptions.SMART_CONTRACT_INVOCATION, "", options);
  let signedContractInvocationTx = await signDLTransactions(overledgerSDK, [erc20ContractInvocationTx]);
  const result = (await overledgerSDK.send(signedContractInvocationTx)).data;
  console.log(`result ${JSON.stringify(result)}`);
  const transactionHash = result.dltData[0].transactionHash;
  return transactionHash;
}

function buildDLTransaction(overledgerSDK, overledgerDLT, toAddressOnDL, subTypeForDL, messageForDL, optionsForDL) {

  let transaction = null;
  if (overledgerSDK.dlts[overledgerDLT] != undefined) {
    try {
      transaction = {
        dlt: overledgerDLT,
        type: TransactionTypeOptions.ACCOUNTS,
        subType: { name: subTypeForDL },
        message: messageForDL,
        toAddress: toAddressOnDL, ...optionsForDL
      };
      console.log(`transaction ${JSON.stringify(transaction)}`);
    } catch (err) {
      console.log("Error when building transaction for " + overledgerDLT + ": " + err);
    }
  }
  return transaction;

}

async function signDLTransactions(overledgerSDK, transactions) {

  let signedTransactions = null;
  if (Array.isArray(transactions) && (overledgerSDK != undefined)) {
    try {
      signedTransactions = await overledgerSDK.sign(transactions);
      console.log("after sign");
    } catch (err) {
      console.log("Error when signing transaction for: " + err);
    }
  }
  return signedTransactions;

}

async function getData(overledger, dltKey, functionName, disputeId, paymentChannelContractAddress) {
  const input = {
    fromAddress: dltKey.dltAddress,
    contractAddress: paymentChannelContractAddress,
    funcName: functionName,
    inputValues: [
      {
        type: "uint256",
        value: disputeId,
      }
    ],
    outputTypes: [
      functionsNames[functionName]
    ]
  }
  const res = await readContract(overledger, dltKey.dltName, input);
  return { fname: functionName, result: res.data.results };
}


async function getTreasuryPaymentChannelContractAddress(overledger, dltKey, paymentChannelByteCodeContract, offset, length) {
  const resp = await getTreasuryPaymentChannelContract(overledger, dltKey, paymentChannelByteCodeContract, offset, length);
  let contractAddress;
  if (resp) {
    contractAddress = resp.creationDetails.createdContract;
  }
  return contractAddress;
}

async function getTreasuryPaymentChannelContract(overledger, dltKey, paymentChannelByteCodeContract, offset, length) {
  // see the case where the number of transactions is big ( search by chunks ?)
  let latestCreationMapp;
  const response = await overledger.readTransactionsByMappId(offset, length);
  let creationDetails;
  if (response) {
    const transactions = response.data;
    const txns = transactions.transactions;
    if (txns && txns.length > 0) {
      const sortedTxns = txns.filter(t => t.dltData.filter(d => d.dlt === DltNames.ethereum)).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
      for (let txn of sortedTxns) {
        const dltData = txn.dltData;
        const dltDataEth = dltData.filter(d => d.dlt === DltNames.ethereum);
        for (let data of dltDataEth) {
          const txnHash = data.transactionHash;
          const error = data.status.status;
          if (txnHash && error !== 'error') {
            let txnDetails;
            try {
              txnDetails = await overledger.search.getTransaction(txnHash);
            } catch (e) {
              continue;
            }
            const data = txnDetails.data;
            if (data && data.data) {
              const txnInfos = data.data;
              if (txnInfos.creates !== '' && txnInfos.to === null) {
                const contractIdentifierParams = new RequestParamValue(dltKey, "contractIdentifier");
                console.log(`contractIdentifierParams ${contractIdentifierParams}`);
                const resp = await readTreasuryPaymentChannelParams(overledger, contractIdentifierParams.dltKey, contractIdentifierParams.paramName, txnInfos.creates);
                console.log(`resp ${JSON.stringify(resp)}`);
                const contractIdentifier = resp.result[0];
                console.log(`contractIdentifier ${contractIdentifier}`);
                if (contractIdentifier === "0x" + paymentChannelByteCodeContract) {
                  latestCreationMapp = txn;
                  creationDetails = { txnHash, createdContract: txnInfos.creates, timestamp: txn.timestamp };
                  return { latestCreationMapp, creationDetails };
                }
              }
            }
          }
        }
      }
      console.log(`latest Creation ${JSON.stringify(latestCreationMapp)}`);
    } else {
      return [];
    }
    const initOffset = offset ? offset : DEFAULT_OFFSET;
    const initLength = length ? length : DEFAULT_LENGTH;
    return getLatestContract(overledger, initOffset + initLength + 1, initLength);
  } else {
    throw new Error('Failing to read the mappId data');
  }
}

async function readParamValue(overledger, dltKey, functionName, paymentChannelContractAddress) {
  const input = {
    fromAddress: dltKey.dltAddress,
    contractAddress: paymentChannelContractAddress,
    funcName: functionName,
    inputValues: [],
    outputTypes: [
      functionsNames[functionName]
    ]
  }
  console.log(`before readContract input ${JSON.stringify(input)}`);
  const res = await readContract(overledger, dltKey.dltName, input);
  console.log(`res ${res}`);
  return { fname: functionName, result: res.data.results };
}

async function readContract(overledger, dlt, input) {
  return await overledger.search.smartContractQuery(dlt, input);
}

async function loadDataFromFile(fileLocation) {
  const content = await readFile(fileLocation, 'utf8');
  return content;
}

/**
 * allows any party to check if a tx has been confirmed 
 * @param {*} readOrderParameters 
 */
async function checkForTransactionConfirmation(overledgerSDK, transactionHash, retry, maxRetry) {
  sleep(3000);
  let confirmationResp;
  let txParams = await overledgerSDK.search.getTransaction(transactionHash.toString());
  if (txParams.data.dlt && txParams.data.dlt.toUpperCase() === DltNameOptions.ETHEREUM.toUpperCase()) {
    confirmationResp = txParams.data.data.blockNumber;
    if (parseInt(confirmationResp, 10) > 0) {
      console.log(`ethereum transaction ${transactionHash} confirmed`);
      return true;
    }
  }
  if (retry < maxRetry) {
    return checkForTransactionConfirmation(overledgerSDK, transactionHash, retry + 1, maxRetry)
  }
  return false;
}

function constructPaymentMessage(receiverAddress, contractAddress, tokenAmount, nonce) {
  const types = ["address", "uint256", "uint256", "address"];
  const values = [receiverAddress, tokenAmount, nonce, contractAddress];
  const hash = "0x" + abi.soliditySHA3(types, values).toString('hex');
  console.log(`hash ${hash}`);
  return hash;
}

async function signMessage(messageHash, privateKey) {
  const signAccounts = await web3.eth.accounts.sign(messageHash, privateKey);
  return signAccounts;
}


/**
 * Sleeps for a number of miliseconds
 * @param {*} ms - the number of miliseconds
 */
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}



exports.instantiateOverledgerInstance = instantiateOverledgerInstance;
exports.validateConstructorPaymentChannelParameters = validateConstructorPaymentChannelParameters;
exports.addAccountsToOverledger = addAccountsToOverledger;
exports.startup = startup;
exports.checkForTransactionConfirmation = checkForTransactionConfirmation;
exports.getTreasuryPaymentChannelContractAddress = getTreasuryPaymentChannelContractAddress;
exports.constructPaymentMessage = constructPaymentMessage;
exports.signMessage = signMessage;
exports.claimPayment = claimPayment;
exports.validateClaimPaymentParameters = validateClaimPaymentParameters;
exports.tokenTranferApproval = tokenTranferApproval;
exports.validateTransferApprovalParameters = validateTransferApprovalParameters;
exports.claimTimeout = claimTimeout;
exports.validateClaimTimeoutParameters = validateClaimTimeoutParameters;
exports.requestPaymentProof = requestPaymentProof;
exports.validateRequestPaymentProofParameters = validateRequestPaymentProofParameters;
exports.validateDisputeProofParameters = validateDisputeProofParameters;
exports.sendProof = sendProof;
exports.getData = getData;
exports.readParamValue = readParamValue;
exports.validateGetDataParameters = validateGetDataParameters;
exports.validateReadParamValueParameters = validateReadParamValueParameters;
exports.validateUpdateMerkleRootParameters = validateUpdateMerkleRootParameters;
exports.updateMerkleRoot = updateMerkleRoot;
exports.updateStrMerkleRoot = updateStrMerkleRoot;
exports.validateSendProofParameters = validateSendProofParameters;