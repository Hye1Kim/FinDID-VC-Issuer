const fs = require('fs');
const BASE_ADDRESS_URL = '/home/pslab154/project/issuer-credential/contract/address/';
const BASE_ABI_URL = '/home/pslab154/project/issuer-credential/contract/abi/';
const DIDLedger_JSON =require('/home/pslab154/project/issuer-credential/contract/json/DIDLedger.json');


module.exports = {
    DEPLOYED_JSON_DIDLedger: DIDLedger_JSON,
    DEPLOYED_ADDRESS_DIDLedger: fs.readFileSync(`${BASE_ADDRESS_URL}deployedAddressDIDLedger`, 'utf8').replace(/\n|\r/g, ""),
    DEPLOYED_ABI_DIDLedger: JSON.parse(fs.existsSync(`${BASE_ABI_URL}deployedABIDIDLedger`) && fs.readFileSync(`${BASE_ABI_URL}deployedABIDIDLedger`, 'utf8')),

}