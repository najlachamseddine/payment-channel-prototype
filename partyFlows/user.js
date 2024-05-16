
const request = require('request-promise-native');
// const DltNameOptions = require('@quantnetwork/overledger-types').DltNameOptions;
// const EthereumTypeOptions = require('@quantnetwork/overledger-dlt-ethereum').EthereumTypeOptions;
// const EthereumUintIntOptions = require('@quantnetwork/overledger-dlt-ethereum').EthereumUintIntOptions;

const DltNameOptions = require('../../overledger-sdk-javascript/packages/overledger-types/dist/associatedEnums/DltNameOptions').DltNameOptions;
const EthereumTypeOptions = require('../../overledger-sdk-javascript/packages/overledger-dlt-ethereum/dist/DLTSpecificTypes/associatedEnums/TypeOptions').EthereumTypeOptions;
const EthereumUintIntOptions = require('../../overledger-sdk-javascript/packages/overledger-dlt-ethereum/dist/DLTSpecificTypes/associatedEnums/UintIntBOptions').EthereumUintIntOptions;

const DltKey = require('../TypesDefinitions/DltKey').default;
const functionParameter = require('../TypesDefinitions/functionParameter').default;
const InitialisePaymentChannelInformation = require('../TypesDefinitions/InitialisePaymentChannelInformation').default;
const InitialiseParams = require('../TypesDefinitions/InitialiseParams').default;
const constructPaymentMessage = require('../treasury-payment-functions').constructPaymentMessage;
const signMessage = require('../treasury-payment-functions').signMessage;
const ApprovalParams = require('../TypesDefinitions/ApprovalParams').default;
const BN = require('bn.js');
const ClaimTimeoutParams = require('../TypesDefinitions/ClaimTimeoutParams').default;
const SendDisputeProofParams = require('../TypesDefinitions/SendDisputeProofParams').default;
const UpdateMerkleRootParams = require('../TypesDefinitions/UpdateMerkleRootParams').default;
const MessageMerkleTreeParams = require('../TypesDefinitions/MessageMerkleTreeParams').default;
const ReadParams = require('../TypesDefinitions/ReadParams').default;
const RequestParamValue = require('../TypesDefinitions/RequestParamValue').default;
const computeLeafHash = require('../merkle-tree-utils').computeLeafHash;
const computeLeafsHashes = require('../merkle-tree-utils').computeLeafsHashes;
const computeMerkleTree = require('../merkle-tree-utils').computeMerkleTree;
const getNodesPath = require('../merkle-tree-utils').getNodesPath;

const treasuryPaymentChannelUrl = "http://localhost:4000";

//const network = "http://internal-gw-1862440128.eu-west-2.elb.amazonaws.com/v1/";
const network = "testnet";
const erc20ContractAddress = "0xFab46E002BbF0b4509813474841E0716E6730136"; //FAU
const ethPrivateKey = "0x1969D2C1EF82A5D1844C9C3A49A66245B2E927A6BC1D9F7F64B1376588A53B01"; // najla MM Account1
const ethAddress = "0x7e0A65af0Dae83870Ce812F34C3A3D8626530d10";
const ethReceiverAddress = "0x105360Ba21773A9175A8daba66CA6C7654F7A3f2"; // najla MM account Party B // treasury
const ethFinalReceiverAddress = "0x2c8251052663244f37BAc7Bde1C6Cb02bBffff93"; // gateway
const smartContractPaymentChannelByteCodeSha256Hash = "7df2b98f7f3f376cc108253aa3fc95aba1feeed0da9484f450c7cf611a9c55d7";
const tokenAmount = 2;
const decimals = 18;
const tokensAmountToBeClaimed = tokenAmount * Math.pow(10, decimals);
const nonce = 2;
const contractAddress = "0x59053044568d65535da64ea36cd0670c9422f3fe";

const ethDltKey = new DltKey(DltNameOptions.ETHEREUM, ethAddress, ethPrivateKey);
const timeoutDelayISO = new Date('2020-04-06T15:20:00.000Z'); // ISO String()
const timeoutDelay = timeoutDelayISO.getTime();
const constructorParameter1 = new functionParameter(EthereumTypeOptions.ADDRESS, "tokenContractAddress", erc20ContractAddress);
const constructorParameter2 = new functionParameter(EthereumTypeOptions.ADDRESS, "receiverAddress", ethReceiverAddress);
const constructorParameter3 = new functionParameter(EthereumTypeOptions.UINT_B, "expirationTime", timeoutDelay, EthereumUintIntOptions.B256);
const constructorParameter4 = new functionParameter(EthereumTypeOptions.STRING, "contractByteCodeHash", "0x" + smartContractPaymentChannelByteCodeSha256Hash);
const functionParameters = { data: [constructorParameter1, constructorParameter2, constructorParameter3, constructorParameter4] };
const initPaymentChannelInformation = new InitialisePaymentChannelInformation(true, functionParameters, '13000000000', '4397098');
const initialise = new InitialiseParams(ethDltKey, initPaymentChannelInformation);
const approvalParams = new ApprovalParams(ethDltKey, erc20ContractAddress, contractAddress, tokensAmountToBeClaimed, '13000000000', '4397098');
const timeoutParams = new ClaimTimeoutParams(ethDltKey, '13000000000', '4397098');

// should be stored
const listMessages = new Array(
    new MessageMerkleTreeParams(ethAddress.toUpperCase(), ethReceiverAddress.toUpperCase(), ethFinalReceiverAddress.toUpperCase(), 2, 2),
    new MessageMerkleTreeParams(ethAddress.toUpperCase(), ethReceiverAddress.toUpperCase(), ethFinalReceiverAddress.toUpperCase(), 1, 4),
    new MessageMerkleTreeParams(ethAddress.toUpperCase(), ethReceiverAddress.toUpperCase(), ethFinalReceiverAddress.toUpperCase(), 2, 1),
    new MessageMerkleTreeParams(ethAddress.toUpperCase(), ethReceiverAddress.toUpperCase(), ethFinalReceiverAddress.toUpperCase(), 1, 3)
);

/*
 * Set the function to call in the node command line
 * node partyFlows/user.js intializeContract
 * node partyFlows/user.js approveClaimTransfer
 * node partyFlows/user.js computeSignature
 * node partyFlows/user.js claimTimeout
 */
const functionToRun = process.argv[2];
eval(functionToRun + '();');


async function intializeContract() {
    // ****** Initialise the asset migration contract OR get the one already deployed ******
    let initContractHash = await initialiseTreasuryPaymentChannelContract(initialise);
    console.log(`initContractHash ${initContractHash}`);
}

async function approveClaimTransfer() {
    // ****** Give approval to the contract to send token on your behalf (using transformFrom solidity function in the payment channel SC) ******
    const approvalHash = await tranferApproval(approvalParams);
    console.log(`approvalHash ${approvalHash}`);
}

async function computeSignature() {
    // ****** Compute the signature to be sent off chain to the party which is claiming the tokens' amount ******
    const msgHash = constructPaymentMessage(ethReceiverAddress, contractAddress, new BN(tokensAmountToBeClaimed.toString(), 10), nonce);
    const sig = await signMessage(msgHash, ethPrivateKey);
    const paramsToUseToClaimThePayment = { nonce, signature: sig.signature };
    console.log(`Claiming the payment with these parameters: ${JSON.stringify(paramsToUseToClaimThePayment)}`);
}

async function claimTimeout() {
    const claimTimeoutHash = await claimChannelTimeout(timeoutParams);
    console.log(`claimTimeoutHash ${claimTimeoutHash}`);
}

async function updateMerkleRoot() {
    const sortedLeafsHashes = computeLeafsHashes(listMessages);
    console.log(`sortedLeafsHashes ${JSON.stringify(sortedLeafsHashes)}`);
    const merkleTree = computeMerkleTree(sortedLeafsHashes);
    const newMerkleRoot = merkleTree.hash;
    const updateRootParams = new UpdateMerkleRootParams(ethDltKey, "0x" + newMerkleRoot, '13000000000', '4397098');
    const updateRootStrParams = new UpdateMerkleRootParams(ethDltKey, newMerkleRoot.toString(), '13000000000', '4397098');
    const updateRootHash = await updateRoot(updateRootParams);
    console.log(`updateRootHash ${JSON.stringify(updateRootHash)}`);
    const updateRootStrHash = await updateStrRoot(updateRootStrParams);
    console.log(`updateRootStrParams ${JSON.stringify(updateRootStrHash)}`);
}

async function sendProof() {
    // const paramValueParams = new RequestParamValue(ethDltKey, "disputesCounter");
    // const disputesCounter = await readParamValue(paramValueParams);
    const disputesCounter = 4;
    let newDisputesCounter = disputesCounter;

    // while (newDisputesCounter === disputesCounter) {
    //     newDisputesCounter = await readParamValue(paramValueParams);
    // }
     
    console.log(`newDisputesCounter ${newDisputesCounter}`);
       
    // if (newDisputesCounter > disputesCounter) {
        const disputeId = disputesCounter;
        const disputeNonce = await readData(new ReadParams(ethDltKey, disputeId, "getDisputeNonce", '13000000000', '4397098'));
        const disputeTokenAmount = await readData(new ReadParams(ethDltKey, disputeId, "getDisputeTokenAmount", '13000000000', '4397098'));
        const disputeInitialUser = await readData(new ReadParams(ethDltKey, disputeId, "getDisputeInitialUser", '13000000000', '4397098'));
        const disputeReceiver = await readData(new ReadParams(ethDltKey, disputeId, "getDisputeReceiver", '13000000000', '4397098'));
        const disputeFinalReceiver = await readData(new ReadParams(ethDltKey, disputeId, "getDisputeFinalReceiver", '13000000000', '4397098'));
        console.log(`disputeNonce: ${disputeNonce}, disputeTokenAmount: ${disputeTokenAmount}, disputeInitialUser: ${disputeInitialUser}, disputeReceiver: ${disputeReceiver}, disputeFinalReceiver: ${disputeFinalReceiver}`);
        // IS MESSAGE INCLUDED IN LIST MESSAGES ???
        const message = new MessageMerkleTreeParams(disputeInitialUser.toUpperCase(), disputeReceiver.toUpperCase(), disputeFinalReceiver.toUpperCase(), disputeNonce, disputeTokenAmount / Math.pow(10, decimals));
        console.log(`message ${JSON.stringify(message)}`);
        const leafMessage = computeLeafHash(message); // computed from the message MT object 
        console.log(`leafMessage ${JSON.stringify(leafMessage)}`);
        const currentMerkleRoot = await readParamValue(new RequestParamValue(ethDltKey, "currentMessagesMerkleRootStr"));
        console.log(`currentMerkleRoot ${currentMerkleRoot}`);
        // check that leafMessage is included in listMessages ????
        const leafsHashes = computeLeafsHashes(listMessages);
        console.log(`leafsHashes ${JSON.stringify(leafsHashes)}`);
        const merkleTree = computeMerkleTree(leafsHashes);
        console.log(`merkleTree ${JSON.stringify(merkleTree)}`);
        // check that currentMerkleTree === merkleTree.hash if NOT, UPDATE CURRENT MERKLE ROOT AND TREASURY SHOULD SEE IF A DISPUTE STILL EXISTS --> IF YES, RESEND AN OTHER DISPUTE REQUEST WITH THE NEW ROOT
        const proofPath = getNodesPath(merkleTree, leafMessage.hash, []);
        console.log(`proofPath ${JSON.stringify(proofPath)}`);
        const proofPathHex = proofPath.map( n => {
            return "0x" + n;
        });
        const rootUpdated = false;
        const maxTokenAmountForNonce = 2; // get it from listMessages LATER
        const sendProofParams = new SendDisputeProofParams(ethDltKey, disputeId, maxTokenAmountForNonce * Math.pow(10, decimals), proofPathHex, "0x" + leafMessage.hash, rootUpdated, '13000000000', '4397098');
        const sendProofHash = await sendDisputeProof(sendProofParams);
        console.log(`sendProofHash ${sendProofHash}`);
    // } else {
    //     console.log(`No new dispute request`);
    //     return false;
    // }
}


async function initialiseTreasuryPaymentChannelContract(initialiseObj) {
    console.log("****SENDER: INITIALISE TREASURY PAYMENT CHANNEL****");
    const options = {
        uri: new URL("CreatePaymentChannel", treasuryPaymentChannelUrl).href,
        body: initialiseObj,
        json: true
    }
    const resp = await request.post(options);
    if (resp.event == "paramsNotValid") {
        console.log("paramsNotValid: " + resp.result);
        process.exit(1);
    } else if (resp.event == "newContract") {
        console.log("newContract deployed at txHash: " + resp.result.dltData[0].transactionHash);
        console.log("ObjectKeys: " + Object.keys(resp.result.dltData[0]));
        return resp.result.dltData[0].transactionHash;
    } else if (resp.event == "SolidityHashFail") {
        console.log("Solidity code load fail: " + resp.result);
        process.exit(1);
    } else if (resp.event == "ContractAlreadyDeployed") {
        console.log("Contract already deployed at: " + resp.result);
        return "";
    }
}

async function tranferApproval(approvalObj) {
    console.log("****SENDER: TRANSFER APPROVAL****");
    const options = {
        uri: new URL("TokenTransferApproval", treasuryPaymentChannelUrl).href,
        body: approvalObj,
        json: true
    }
    const resp = await request.post(options);
    return resp;
}

async function claimChannelTimeout(approvalObj) {
    console.log("****SENDER: CLAIM TIMEOUT****");
    const options = {
        uri: new URL("ClaimTimeout", treasuryPaymentChannelUrl).href,
        body: approvalObj,
        json: true
    }
    const resp = await request.post(options);
    return resp;
}

async function sendDisputeProof(sendProofParams) {
    console.log("****SENDER: SEND PAYMENT PROOF FOR DISPUTE****");
    const options = {
        uri: new URL("SendDisputeProof", treasuryPaymentChannelUrl).href,
        body: sendProofParams,
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

async function updateRoot(updateRootParams) {
    console.log("****SENDER: UPDATE MERKLE ROOT****");
    const options = {
        uri: new URL("UpdateMerkleRoot", treasuryPaymentChannelUrl).href,
        body: updateRootParams,
        json: true
    }
    const resp = await request.post(options);
    return resp;
}

async function updateStrRoot(updateRootParams) {
    console.log("****SENDER: UPDATE STR MERKLE ROOT****");
    const options = {
        uri: new URL("UpdateStrMerkleRoot", treasuryPaymentChannelUrl).href,
        body: updateRootParams,
        json: true
    }
    const resp = await request.post(options);
    return resp;
}

// 3abea8e8c80619fe09dc73cdee8fafb4f615e6534e826593a13f1c187763da87 leaf
// d6e91ded949ae0073ce6682798f3ebe638b9854e5a7ed52fe1522a81d3f0687f // current merkle root
