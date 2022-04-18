const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const app = express();
const PORT = 6060;
const bodyParser = require('body-parser');
const cors = require('cors');
const CONTRACT = require('./config/contract.js');
const crypto = require('crypto');
const didLedgerJson = require('/home/pslab154/project/issuer-credential/contract/json/DIDLedger.json');
const FinDIDClient = require('./did-auth/didAuth.js');
const finDID = new FinDIDClient({
  network: 'https://api.baobab.klaytn.net:8651',
  regABI: didLedgerJson,
  regAddr: CONTRACT.DEPLOYED_ADDRESS_DIDLedger,
});
const keccak256 = require('keccak256')
const ACCOUNT = require('./config/account.js');
const DID_INFO = require('./config/did.js');
const access = require('./config/access.js');

app.use(express.static('upload'));
app.use(cors());
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); //원래 TRUE였습니다.


// default options
app.use(fileUpload());

app.get('/ping', function(req, res) {
  res.send('pong');
});


async function _sign(data, keyType, privateKey){
  const signature = finDID.sign(data, keyType, privateKey)
  return signature.signature;
}

async function _createHash(data){

  const hash = keccak256(Buffer.from(JSON.stringify(data))).toString('hex')
  return hash

}

async function createVC(uDid,uPubKeyId,claims){

  var claim = Object.keys(claims);
  var claimInfo ={} ;
  const keyType = 'EcdsaSecp256k1RecoveryMethod2020';
  const privateKey = ACCOUNT.ISS_PRIVATE_KEY;
  for(i=0;i<claim.length;i++){
    console.log(claim[i],claims[claim[i]]);
    claimInfo[claim[i]] = await _sign(claims[claim[i]],keyType,privateKey);
  }

  const vc_content = {
    "claims":claims,
    "infos":claimInfo,
    "issuerdid":DID_INFO.ISS_DID, //만들어 놓기 
    "issuerpkid":DID_INFO.ISS_PUBKEY_ID,
    "ownerdid":uDid,
    "ownerpkid":uPubKeyId,
  }

  const ciid = await _createHash(vc_content)
  const cid = await _createHash(ciid)
  vc_content.ciid = ciid ;
  vc_content.cid = cid;


  return vc_content;


}

app.post('/vc', async function(req, res) {
  
  const claims = {'name' : '김혜원', 'phone' : '01041812358', 'age':'24'}

  const uDid = req.body.did;
  const uPubKeyId = req.body.publicKeyID;
  const vc = await createVC(uDid,uPubKeyId,claims);
  console.log(vc);
  res.send(vc);


});





app.listen(PORT, function() {
  console.log('Express server listening on port ', PORT); // eslint-disable-line
});


