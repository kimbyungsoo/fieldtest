const net = require('net'); //비동기네트워크를  위한 API 제공
const fs = require('fs'); //파일시스템과 상호작용하기위한 API 제공
var dev_ip = process.argv[2];
var dev_port = process.argv[3];
let config_packet = process.argv[4];
let packets = {};
  //출력되는 패킷 파일의 시간을 제목으로 나타내기 위함.
var dut = net.connect({ port: dev_port, host: dev_ip }); //DUT의 주소로 TCP 연결
var server = net.createServer(); //넷티마이저의 연결을 수용할 서버 생성
var serverSocket;
if(process.argv[4] == null){
    console.log("Usage : node json_ex_v2 [ip addr] [port addr] [Anything]")
}

let socketDataReceiveCallback = function (data) {
    //data = data.toString('hex')
    dut.write(data);
    data = data.toString('hex')
    console.log("SERVER : DATA RECEIVED  : ", data);
    if (packets[data] == null) {
        packets[data] = 1;
    } else if (packets[data] > 3) {
        writeDataToClient("FINISH", function () {
            serverSocket.end(function () {
                fs.writeFileSync('./jsons/config_Extraction_' + config_packet + '.json', JSON.stringify(packets), {flag: 'w'});
                serverSocket.destroy();
                process.exit();
            });
        })
    } else {
        packets[data] += 1;
    }
};

function writeDataToClient(data, callback) {
    let success = serverSocket.write(data);
    console.log('SERVER : SEND DATA TO CLIENT SUCCESS : ' + String(success).toUpperCase());
    callback();
}

server.on('connection', function (socket) { //넷티마이저와 연결
	setTimeout(function(){
		process.exit();
	}, 1002000);
    socket.on("data", socketDataReceiveCallback);
    serverSocket = socket; //현재 연결된 소켓 정보를 복사.
    //DUT로부터 메시지를 넷티마이저로 전달하기 위함이다.
});
server.on('close', function () {
    console.log('client closed.');
});

dut.on('connect', function () { //DUT와 연결이 성립된 후, 넷티마이저의 연결 요청을 기다립니다.
    console.log('connected to server!');
    server.listen(9090, function () { //9090번 포트를 통해 연결을 받습니다.
        console.log('listening on 9090...');
    });
});

// DUT로부터 받은 데이터를 화면에 출력 
dut.on('data', function (data) {
    serverSocket.write(data);
});

// 접속이 종료됬을때 메시지 출력 
dut.on('end', function () {
    console.log('DUT disconnected.');
}); 

// 에러가 발생할때 에러메시지 화면에 출력 
dut.on('error', function (err) {
    console.log('DUT' + err);
}); 

// connection에서 timeout이 발생하면 메시지 출력 
dut.on('timeout', function () {
    console.log('DUT connection timeout.');
});
