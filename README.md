# FinDID-VC-Issuer
FinDID 예제 응용 서비스 - 크리덴셜 발급자 

## 디렉토리 및 파일 구성 

/config : 환경 파일 디렉토리
- access.js : 접근할 서비스의 엔드포인트 환경파일 
- account.js : did-service의 클레이튼 계정정보 환경파일
- contract.js : 배포된 컨트랙트 정보(abi, address) 환경파일
- did.js : did-service의 did 정보 환경파일

main.js : 발급자의 메인 서버 

## DB 설정

1. docker 설치 
https://docs.docker.com/engine/install/ubuntu/

2. cassandra DB 설정 (using Docker)

- cassandra 이미지 pull
```shell
docker pull cassandra  
```

- cassandra 컨테이너 실행 (single node)
```shell
docker create network some-network
docker run --name some-cassandra --network some-network -d cassandra:tag
```

- cassandra 테이블 생성 (cqlsh)
```shell
CREATE KEYSPACE vc_storage WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor':1 } # 키 스페이스 생성 (복제 x 버전)
use vc_storage;

desc vc_storage ; # 해당 키스페이스 구조 볼수 있음

CREATE TABLE vc( vcId varchar,owner varchar,issuer varchar,vc varchar, PRIMARY KEY (vcId));

```


## 실행

1. npm 모듈 설치
```shell
npm install  
```

2. 발급자 서버 실행 
```shell
node main.js 
```