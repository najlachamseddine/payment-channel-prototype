
const request = require('request-promise-native');
const DltKey = require('../TypesDefinitions/DltKey').default;
// const DltNameOptions = require('@quantnetwork/overledger-types').DltNameOptions;
const DltNameOptions = require('../../overledger-sdk-javascript/packages/overledger-types/dist/associatedEnums/DltNameOptions').DltNameOptions;

const treasuryPaymentChannelUrl = "http://localhost:4000";

const ethPrivateKey = "0x3683C26883ED1FA1AF666E8162BAE1976F39E04C77C1CB51D70C0DDBD67446A5";
const ethAddress = "0x2c8251052663244f37BAc7Bde1C6Cb02bBffff93"; // najla MM account Oracle
const ethDltKey = new DltKey(DltNameOptions.ETHEREUM, ethAddress, ethPrivateKey);

