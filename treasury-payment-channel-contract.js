console.log('Starting imports');

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const DltNameOptions = require('../overledger-sdk-javascript/packages/overledger-types/dist/associatedEnums/DltNameOptions').DltNameOptions;
const validateConstructorPaymentChannelParameters = require('./treasury-payment-functions').validateConstructorPaymentChannelParameters;
const instantiateOverledgerInstance = require('./treasury-payment-functions').instantiateOverledgerInstance;
const addAccountsToOverledger = require('./treasury-payment-functions').addAccountsToOverledger;
const startup = require('./treasury-payment-functions').startup;
const checkForTransactionConfirmation = require('./treasury-payment-functions').checkForTransactionConfirmation;
const validateClaimPaymentParameters = require('./treasury-payment-functions').validateClaimPaymentParameters;
const claimPayment = require('./treasury-payment-functions').claimPayment;
const validateTransferApprovalParameters = require('./treasury-payment-functions').validateTransferApprovalParameters;
const tokenTranferApproval = require('./treasury-payment-functions').tokenTranferApproval;
const claimTimeout = require('./treasury-payment-functions').claimTimeout;
const validateClaimTimeoutParameters = require('./treasury-payment-functions').validateClaimTimeoutParameters;
const requestPaymentProof = require('./treasury-payment-functions').requestPaymentProof;
const sendProof = require('./treasury-payment-functions').sendProof;
const getData = require('./treasury-payment-functions').getData;
const readParamValue = require('./treasury-payment-functions').readParamValue;
const validateReadParamValueParameters = require('./treasury-payment-functions').validateReadParamValueParameters;
const validateGetDataParameters = require('./treasury-payment-functions').validateGetDataParameters;
const validateUpdateMerkleRootParameters = require('./treasury-payment-functions').validateUpdateMerkleRootParameters;
const updateMerkleRoot = require('./treasury-payment-functions').updateMerkleRoot;
const validateRequestPaymentProofParameters = require('./treasury-payment-functions').validateRequestPaymentProofParameters;
const updateStrMerkleRoot = require('./treasury-payment-functions').updateStrMerkleRoot;
const validateSendProofParameters = require('./treasury-payment-functions').validateSendProofParameters;

const overledgerMappId = "payment.channel.demo";
const OverledgerBpiKey = "paymentchannelbpikey";
const network = "testnet";


const solidityTreasuryPaymentChannelFileLocation = "./smartContracts/TreasuryPaymentChannel.txt";
const smartContractPaymentChannelByteCodeSha256Hash = "7df2b98f7f3f376cc108253aa3fc95aba1feeed0da9484f450c7cf611a9c55d7";


console.log('Starting payment channel for treasury demo');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true })); // to support URL-encoded bodies
app.use(bodyParser.json())
app.set('view engine', 'ejs');

const port = process.argv[2];

if (port && port > 0) {
    app.listen(port, async function () {
        console.log(`Example app listening on port ${port}!`);
    });
} else {
    console.log(`Port server must be defined: node treasury-payment-channel-contract.js portNumber`);
}



app.post('/CreatePaymentChannel', async function (req, res) {
    console.log("********************SERVER:CREATE PAYMENT CHANNEL BY THE SENDER********************");
    let toReturn;
    try {
        let initPaymentChannelAppParams = req.body;
        console.log(`initPaymentChannelAppParams`, initPaymentChannelAppParams);
        let validationFeedback = validateConstructorPaymentChannelParameters(initPaymentChannelAppParams); //will return text if there is an error OR false
        console.log(`validationFeedback `, validationFeedback);
        if (validationFeedback) {
            let overledgerSDK = await instantiateOverledgerInstance(overledgerMappId, OverledgerBpiKey, [DltNameOptions.ETHEREUM], network);
            console.log(`overledgerSDK `, overledgerSDK);
            await addAccountsToOverledger(overledgerSDK, [DltNameOptions.ETHEREUM], [initPaymentChannelAppParams.dltKey.dltSecretKey]);
            //deploy migration contract onto ethereum and set the ERC-20 contract address and the Oracle address in the constructor
            let resp = await startup(overledgerSDK, initPaymentChannelAppParams, solidityTreasuryPaymentChannelFileLocation, smartContractPaymentChannelByteCodeSha256Hash, network);
            console.info(`resp startup ${JSON.stringify(resp)}`);
            let isInitContractConfirmed;
            if (resp.event === "newContract") {
                isInitContractConfirmed = await checkForTransactionConfirmation(overledgerSDK, resp.result, 0, 600);
            }
            if (isInitContractConfirmed) {
                toReturn = {
                    success: true,
                    msg: resp
                };
            } else {
                toReturn = {
                    success: false,
                    msg: "Init contract transaction hash not confirmed"
                };
            }
        } else {
            toReturn = {
                success: false,
                msg: "paramsNotValid: " + validationFeedback
            }
        }
    } catch (e) {
        console.error('error', e);
        toReturn = {
            success: false,
            msg: 'error:_' + e
        }
    }
    return res.send(toReturn);
});


app.post('/TokenTransferApproval', async function (req, res) {
    console.log("********************FUNCTION:WithdrawAssetRequest********************");
    let toReturn;
    let isApproved = false;
    let approvalHash;
    try {
        let approvalParams = req.body;
        console.log(`approvalParams ${JSON.stringify(approvalParams)}`);
        let validationFeedback = validateTransferApprovalParameters(approvalParams); //will return text if there is an error
        console.log(`validationFeedback approvalParams ${validationFeedback}`);
        if (validationFeedback) {
            let overledgerSDK = await instantiateOverledgerInstance(overledgerMappId, OverledgerBpiKey, [DltNameOptions.ETHEREUM], network);
            await addAccountsToOverledger(overledgerSDK, [DltNameOptions.ETHEREUM], [approvalParams.dltKey.dltSecretKey]);
            approvalHash = await tokenTranferApproval(overledgerSDK, approvalParams.dltKey, approvalParams.erc20ContractAddress, approvalParams.receiver, approvalParams.amount, approvalParams.feePrice, approvalParams.feeLimit);
            console.log(`approvalParams`, approvalHash);
            isApproved = await checkForTransactionConfirmation(overledgerSDK, approvalHash, 0, 600);
            if (isApproved) {
                toReturn = {
                    success: true,
                    msg: { transactionHash: approvalHash }
                };
            } else {
                toReturn = {
                    success: false,
                    msg: "approval transfer for payment channel is not confirmed"
                };
            }
        } else {
            toReturn = {
                success: false,
                msg: "Params_Not_Valid: " + validationFeedback
            }
        }
    } catch (e) {
        console.error('error', e);
        toReturn = {
            success: false,
            msg: 'error:_' + e
        }

    }

    return res.send(toReturn);

})



app.post('/ClaimPayment', async function (req, res) {
    console.log("********************FUNCTION: CLAIM A PAYMENT BY RECEIVER********************");
    let toReturn;
    let isClaimPayment = false;
    let claimPaymentHash;
    try {
        let claimPaymentParams = req.body;
        console.log(`claimPaymentParams ${JSON.stringify(claimPaymentParams)}`);
        let validationFeedback = validateClaimPaymentParameters(claimPaymentParams); //will return text if there is an error
        console.log(`validationFeedback claimPaymentParams ${validationFeedback}`);
        if (validationFeedback) {
            let overledgerSDK = await instantiateOverledgerInstance(overledgerMappId, OverledgerBpiKey, [DltNameOptions.ETHEREUM], network);
            await addAccountsToOverledger(overledgerSDK, [DltNameOptions.ETHEREUM], [claimPaymentParams.dltKey.dltSecretKey]);
            // let paymentChannelContractAddress = await getAssetMigrationContractAddress(overledgerSDK, claimPaymentParams.dltKey, smartContractPaymentChannelByteCodeSha256Hash);
            let paymentChannelContractAddress = "0x59053044568d65535da64ea36cd0670c9422f3fe";
            claimPaymentHash = await claimPayment(overledgerSDK, claimPaymentParams.dltKey, paymentChannelContractAddress, claimPaymentParams.erc20TokenAmount, claimPaymentParams.nonce, claimPaymentParams.signature, claimPaymentParams.feePrice, claimPaymentParams.feeLimit);
            console.log(`claimPayment`, claimPaymentHash);
            isClaimPayment = await checkForTransactionConfirmation(overledgerSDK, claimPaymentHash, 0, 600);
            if (isClaimPayment) {
                toReturn = {
                    success: true,
                    msg: { transactionHash: claimPaymentHash }
                };
            } else {
                toReturn = {
                    success: false,
                    msg: "withdrawal asset transaction hash is not confirmed"
                };
            }
        } else {
            toReturn = {
                success: false,
                msg: "Params_Not_Valid: " + validationFeedback
            }
        }
    } catch (e) {
        console.error('error', e);
        toReturn = {
            success: false,
            msg: 'error:_' + e
        }

    }

    return res.send(toReturn);

})

app.post('/ClaimTimeout', async function (req, res) {
    console.log("********************FUNCTION: CLAIM TIMEOUT BY THE CHANNEL OWNER********************");
    let toReturn;
    let isClaimTimeout = false;
    let claimTimeoutHash;
    try {
        let claimTimeoutParams = req.body;
        console.log(`claimTimeoutParams ${JSON.stringify(claimTimeoutParams)}`);
        let validationFeedback = validateClaimTimeoutParameters(claimTimeoutParams); //will return text if there is an error
        console.log(`validationFeedback claimTimeoutParams ${validationFeedback}`);
        if (validationFeedback) {
            let overledgerSDK = await instantiateOverledgerInstance(overledgerMappId, OverledgerBpiKey, [DltNameOptions.ETHEREUM], network);
            await addAccountsToOverledger(overledgerSDK, [DltNameOptions.ETHEREUM], [claimTimeoutParams.dltKey.dltSecretKey]);
            // let paymentChannelContractAddress = await getAssetMigrationContractAddress(overledgerSDK, claimPaymentParams.dltKey, smartContractPaymentChannelByteCodeSha256Hash);
            let paymentChannelContractAddress = "0x59053044568d65535da64ea36cd0670c9422f3fe";
            claimTimeoutHash = await claimTimeout(overledgerSDK, claimTimeoutParams.dltKey, paymentChannelContractAddress, claimTimeoutParams.feePrice, claimTimeoutParams.feeLimit);
            console.log(`claimTimeout `, claimTimeoutHash);
            isClaimTimeout = await checkForTransactionConfirmation(overledgerSDK, claimTimeoutHash, 0, 600);
            if (isClaimTimeout) {
                toReturn = {
                    success: true,
                    msg: { transactionHash: claimTimeoutHash }
                };
            } else {
                toReturn = {
                    success: false,
                    msg: "claim timeout hash is not confirmed"
                };
            }
        } else {
            toReturn = {
                success: false,
                msg: "Params_Not_Valid: " + validationFeedback
            }
        }
    } catch (e) {
        console.error('error', e);
        toReturn = {
            success: false,
            msg: 'error:_' + e
        }

    }

    return res.send(toReturn);

})

app.post('/RequestPaymentProof', async function (req, res) {
    console.log("********************FUNCTION: REQUEST PAYMENT PROOF FOR DISPUTE********************");
    let toReturn;
    let isRequestPaymentProof = false;
    let requestPaymentProofHash;
    try {
        let requestPaymentProofParams = req.body;
        console.log(`requestPaymentProofParams ${JSON.stringify(requestPaymentProofParams)}`);
        let validationFeedback = validateRequestPaymentProofParameters(requestPaymentProofParams); //will return text if there is an error
        console.log(`validationFeedback requestPaymentProofParams ${validationFeedback}`);
        if (validationFeedback) {
            let overledgerSDK = await instantiateOverledgerInstance(overledgerMappId, OverledgerBpiKey, [DltNameOptions.ETHEREUM], network);
            await addAccountsToOverledger(overledgerSDK, [DltNameOptions.ETHEREUM], [requestPaymentProofParams.dltKey.dltSecretKey]);
            // let paymentChannelContractAddress = await getAssetMigrationContractAddress(overledgerSDK, claimPaymentParams.dltKey, smartContractPaymentChannelByteCodeSha256Hash);
            let paymentChannelContractAddress = "0x59053044568d65535da64ea36cd0670c9422f3fe";
            requestPaymentProofHash = await requestPaymentProof(overledgerSDK, requestPaymentProofParams.dltKey, paymentChannelContractAddress, requestPaymentProofParams.erc20TokenAmount, requestPaymentProofParams.nonce, requestPaymentProofParams.initialUserAddress, requestPaymentProofParams.receiverAddress, requestPaymentProofParams.finalReceiverAddress, requestPaymentProofParams.merkleRoot, requestPaymentProofParams.feePrice, requestPaymentProofParams.feeLimit);
            console.log(`requestPaymentProof`, requestPaymentProofHash);
            isRequestPaymentProof = await checkForTransactionConfirmation(overledgerSDK, requestPaymentProofHash, 0, 600);
            if (isRequestPaymentProof) {
                toReturn = {
                    success: true,
                    msg: { transactionHash: requestPaymentProofHash }
                };
            } else {
                toReturn = {
                    success: false,
                    msg: "request payment proof hash is not confirmed"
                };
            }
        } else {
            toReturn = {
                success: false,
                msg: "Params_Not_Valid: " + validationFeedback
            }
        }
    } catch (e) {
        console.error('error', e);
        toReturn = {
            success: false,
            msg: 'error:_' + e
        }

    }

    return res.send(toReturn);

})

app.post('/SendDisputeProof', async function (req, res) {
    console.log("********************FUNCTION: REQUEST PAYMENT PROOF FOR DISPUTE********************");
    let toReturn;
    let isSendProof = false;
    let sendProofHash;
    try {
        let sendProofParams = req.body;
        console.log(`sendProofParams ${JSON.stringify(sendProofParams)}`);
        let validationFeedback = validateSendProofParameters(sendProofParams); //will return text if there is an error
        console.log(`validationFeedback sendProofParams ${validationFeedback}`);
        if (validationFeedback) {
            let overledgerSDK = await instantiateOverledgerInstance(overledgerMappId, OverledgerBpiKey, [DltNameOptions.ETHEREUM], network);
            await addAccountsToOverledger(overledgerSDK, [DltNameOptions.ETHEREUM], [sendProofParams.dltKey.dltSecretKey]);
            // let paymentChannelContractAddress = await getAssetMigrationContractAddress(overledgerSDK, claimPaymentParams.dltKey, smartContractPaymentChannelByteCodeSha256Hash);
            let paymentChannelContractAddress = "0x59053044568d65535da64ea36cd0670c9422f3fe";
            sendProofHash = await sendProof(overledgerSDK, sendProofParams.dltKey, paymentChannelContractAddress, sendProofParams.disputeId, sendProofParams.maxTokenAmountForNonce, sendProofParams.proofPath, sendProofParams.messageHash, sendProofParams.isRootUpdated, sendProofParams.feePrice, sendProofParams.feeLimit);
            console.log(`send payment proof`, sendProofHash);
            isSendProof = await checkForTransactionConfirmation(overledgerSDK, sendProofHash, 0, 600);
            if (isSendProof) {
                toReturn = {
                    success: true,
                    msg: { transactionHash: sendProofHash }
                };
            } else {
                toReturn = {
                    success: false,
                    msg: "send payment proof hash is not confirmed"
                };
            }
        } else {
            toReturn = {
                success: false,
                msg: "Params_Not_Valid: " + validationFeedback
            }
        }
    } catch (e) {
        console.error('error', e);
        toReturn = {
            success: false,
            msg: 'error:_' + e
        }

    }

    return res.send(toReturn);

})

app.post('/UpdateMerkleRoot', async function (req, res) {
    console.log("********************FUNCTION: UPDATE OF THE MERKLE ROOT BY THE SENDER********************");
    let toReturn;
    let isUpdateMerkleRoot = false;
    let updateMerkleRootHash;
    try {
        let updateMerkleRootParams = req.body;
        console.log(`updateMerkleRootParams ${JSON.stringify(updateMerkleRootParams)}`);
        let validationFeedback = validateUpdateMerkleRootParameters(updateMerkleRootParams);
        console.log(`validationFeedback updateMerkleRootParams ${validationFeedback}`);
        if (validationFeedback) {
            let overledgerSDK = await instantiateOverledgerInstance(overledgerMappId, OverledgerBpiKey, [DltNameOptions.ETHEREUM], network);
            await addAccountsToOverledger(overledgerSDK, [DltNameOptions.ETHEREUM], [updateMerkleRootParams.dltKey.dltSecretKey]);
            // let paymentChannelContractAddress = await getAssetMigrationContractAddress(overledgerSDK, claimPaymentParams.dltKey, smartContractPaymentChannelByteCodeSha256Hash);
            let paymentChannelContractAddress = "0x59053044568d65535da64ea36cd0670c9422f3fe";
            updateMerkleRootHash = await updateMerkleRoot(overledgerSDK, updateMerkleRootParams.dltKey, paymentChannelContractAddress, updateMerkleRootParams.newRoot, updateMerkleRootParams.feePrice, updateMerkleRootParams.feeLimit);
            console.log(`updateMerkleRoot`, updateMerkleRootHash);
            isUpdateMerkleRoot = await checkForTransactionConfirmation(overledgerSDK, updateMerkleRootHash, 0, 600);
            if (isUpdateMerkleRoot) {
                toReturn = {
                    success: true,
                    msg: { transactionHash: updateMerkleRootHash }
                };
            } else {
                toReturn = {
                    success: false,
                    msg: "update merkle root hash is not confirmed"
                };
            }
        } else {
            toReturn = {
                success: false,
                msg: "Params_Not_Valid: " + validationFeedback
            }
        }
    } catch (e) {
        console.error('error', e);
        toReturn = {
            success: false,
            msg: 'error:_' + e
        }

    }

    return res.send(toReturn);

})

app.post('/UpdateStrMerkleRoot', async function (req, res) {
    console.log("********************FUNCTION: UPDATE OF THE MERKLE ROOT BY THE SENDER********************");
    let toReturn;
    let isUpdateMerkleRoot = false;
    let updateMerkleRootHash;
    try {
        let updateMerkleRootParams = req.body;
        console.log(`updateMerkleRootParams ${JSON.stringify(updateMerkleRootParams)}`);
        let validationFeedback = validateUpdateMerkleRootParameters(updateMerkleRootParams);
        console.log(`validationFeedback updateMerkleRootParams ${validationFeedback}`);
        if (validationFeedback) {
            let overledgerSDK = await instantiateOverledgerInstance(overledgerMappId, OverledgerBpiKey, [DltNameOptions.ETHEREUM], network);
            await addAccountsToOverledger(overledgerSDK, [DltNameOptions.ETHEREUM], [updateMerkleRootParams.dltKey.dltSecretKey]);
            // let paymentChannelContractAddress = await getAssetMigrationContractAddress(overledgerSDK, claimPaymentParams.dltKey, smartContractPaymentChannelByteCodeSha256Hash);
            let paymentChannelContractAddress = "0x59053044568d65535da64ea36cd0670c9422f3fe";
            updateMerkleRootHash = await updateStrMerkleRoot(overledgerSDK, updateMerkleRootParams.dltKey, paymentChannelContractAddress, updateMerkleRootParams.newRoot, updateMerkleRootParams.feePrice, updateMerkleRootParams.feeLimit);
            console.log(`updateMerkleRoot`, updateMerkleRootHash);
            isUpdateMerkleRoot = await checkForTransactionConfirmation(overledgerSDK, updateMerkleRootHash, 0, 600);
            if (isUpdateMerkleRoot) {
                toReturn = {
                    success: true,
                    msg: { transactionHash: updateMerkleRootHash }
                };
            } else {
                toReturn = {
                    success: false,
                    msg: "update merkle root hash is not confirmed"
                };
            }
        } else {
            toReturn = {
                success: false,
                msg: "Params_Not_Valid: " + validationFeedback
            }
        }
    } catch (e) {
        console.error('error', e);
        toReturn = {
            success: false,
            msg: 'error:_' + e
        }

    }

    return res.send(toReturn);

})


app.post('/getData', async function (req, res) {
    console.log("********************FUNCTION:Get data********************");
    try {
        let readParams = req.body;
        console.log(`readDataParams `, readParams);
        let validationFeedback = validateGetDataParameters(readParams);
        if (validationFeedback) {
            let overledgerSDK = await instantiateOverledgerInstance(overledgerMappId, OverledgerBpiKey, [DltNameOptions.ETHEREUM], network);
            console.log(`overledgerSDK ${overledgerSDK}`);
            await addAccountsToOverledger(overledgerSDK, [DltNameOptions.ETHEREUM], [readParams.dltKey.dltSecretKey]);
            // let paymentChannelContractAddress = await getAssetMigrationContractAddress(overledgerSDK, readParams.dltKey, soliditySmartContractAssetMigrationByteCodeSha256Hash);
            let paymentChannelContractAddress = "0x59053044568d65535da64ea36cd0670c9422f3fe";
            const data = await getData(overledgerSDK, readParams.dltKey, readParams.functionName, readParams.id, paymentChannelContractAddress);
            console.log(`readData `, data);
            toReturn = {
                success: true,
                msg: data.result[0]
            };
        } else {
            toReturn = {
                success: false,
                msg: "Params_Not_Valid: " + JSON.stringify(readParams)
            }
        }
    } catch (e) {
        console.error('error', e);
        toReturn = {
            success: false,
            msg: 'error:_' + e
        }

    }

    return res.send(toReturn.msg);


});

app.post('/readParamValue', async function (req, res) {
    console.log(`read Param Value`);
    let readValueParams = req.body;
    let validationFeedback = validateReadParamValueParameters(readValueParams);
    console.log(`readValueParams ${JSON.stringify(readValueParams)}`);
    if (validationFeedback) {
        let overledgerSDK = await instantiateOverledgerInstance(overledgerMappId, OverledgerBpiKey, [DltNameOptions.ETHEREUM], network);
        console.log(`overledgerSDK ${overledgerSDK}`);
        await addAccountsToOverledger(overledgerSDK, [DltNameOptions.ETHEREUM], [readValueParams.dltKey.dltSecretKey]);
        // let paymentChannelContractAddress = await getAssetMigrationContractAddress(overledgerSDK, readValueParams.dltKey, soliditySmartContractAssetMigrationByteCodeSha256Hash);
        let paymentChannelContractAddress = "0x59053044568d65535da64ea36cd0670c9422f3fe";
        console.log(`test`);
        const resp = await readParamValue(overledgerSDK, readValueParams.dltKey, readValueParams.paramName, paymentChannelContractAddress);
        return res.send(resp.result[0]);
    } else {
        return res.send({ success: false, msg: "Params_Not_Valid: " + JSON.stringify(readParams) });
    }
});