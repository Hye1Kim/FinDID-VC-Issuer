const PORT = 6060;

const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');
const axios = require('axios');
const cors = require('cors');
const finDID = require('fin-did-auth');
const keccak256 = require('keccak256')
const cassandra = require('cassandra-driver');

const ACCOUNT = require('./config/account.js');
const DID_INFO = require('./config/did.js');
const ACCESS = require('./config/access.js');

app.use(express.static('upload'));
app.use(cors());
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); //원래 TRUE였습니다.


// default options
app.use(fileUpload());

// const client = new cassandra.Client({
//   contactPoints:['203.250.77.154'],
//   localDataCenter:'datacenter1',
//   keyspace: 'vc_storage',
//   socketOptions:{
//     readTimeout:0,
//     connectTimeout: 100000
//   }
// });

app.get('/ping', function(req, res) {
  res.send('pong');
});


//did 당 claim들이 정의된 json 파일이 있음 거기서 claim 꺼내오기 
async function _getClaim(uDid){
  const path = ACCESS.CLAIM_PATH +`${uDid}.json`;
  const claimJson = require(path);
  return claimJson;

}

async function _sign(data, keyType, privateKey){
  const signature = await finDID.sign(data, keyType, privateKey)
  return signature.signature;
}

async function _createHash(data){

  const hash = keccak256(Buffer.from(JSON.stringify(data))).toString('hex')
  return hash

}

async function createVC(uDid,uPubKeyId,claims){

  var claim = Object.keys(claims);
  var claimInfo ={} ;
  const keyType = DID_INFO.ISS_KEYTYPE;
  const privateKey = ACCOUNT.ISS_PRIVATE_KEY;

  const vc_content = {
    "claims":claims,
    "issuerdid":DID_INFO.ISS_DID, //만들어 놓기 
    "issuerpkid":DID_INFO.ISS_PUBKEY_ID,
    "ownerdid":uDid,
    "ownerpkid":uPubKeyId,
  }

  const ciid = await _createHash(vc_content)
  vc_content.ciid = ciid;

  for(i=0;i<claim.length;i++){
    var signData = claims[claim[i]]+ ciid;
    claimInfo[claim[i]] = await _sign(signData,keyType,privateKey);
  }
  vc_content.infos = claimInfo;
  const cid = await _createHash(vc_content)
  vc_content.cid =cid;


  return vc_content;


}


app.post('/vc', async function(req, res) {
  console.log(req.body);
  
  //did 인증 did, publicKeyID, sginature : did에 사인한값
  const uSig = req.body.signature;
  const uDid = req.body.did;
  const uPubKeyId = req.body.publicKeyID;

  const auth_meta = {
    'state':[true,false,false], // 0: user, 1: issuer, 2: verifier
    'user': {
      'did':uDid,
      'pubKeyID':uPubKeyId
    }
  }

  // const auth_info = await axios({
  //   url: ACCESS.DID_SERVICE+"/auth-info // 0: user, 1: issuer, 2: verifier",
  //   method:"post",
  //   data: auth_meta //json
  // });

  // const user_info = auth_info.data.user
  
  // const isValid = await finDID.didAuth(user_info,uSig,JSON.stringify(uDid));
  

  //if(!isValid) res.send("Error : The requestor's identity is not confirmed.");

  const claims = await _getClaim(uDid);
  const vc = await createVC(uDid,uPubKeyId,claims);
  console.log(vc);


  //1. did 서비스에 크리덴셜 + issuer did 정보 보냄
  
  request.post({
    headers: {
      'content-type': 'application/json'
    },
    url: `${ACCESS.DID_SERVICE}/register-vc`, //니서버
    body: {
      'vc': vc,
    },
    json: true

  },function (error, res, body) {
    if(error) {
      console.log(error); 
      return error;
    }
  });


  //2. 스토리지에 vc 저장
  // let query = 'INSERT INTO vc_storage.vc(vcId,owner,issuer,vc) VALUES (?,?,?,?)';
  // client.execute(query,[vc.cid,vc.ownerdid,vc.issuerdid,JSON.stringify(vc)], function(err){
  //   if(err) res.send(err);
  // })
  
  //3. 소유자에게 vc 발급 
  res.send(vc); //user wallet 에게


});


app.listen(PORT, function() {
  console.log('Express server listening on port ', PORT); // eslint-disable-line
});


