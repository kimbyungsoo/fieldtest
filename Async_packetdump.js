const net = require('net'); //비동기네트워크를  위한 API 제공
var fs = require('fs'); //파일시스템과 상호작용하기위한 API 제공
var dev_ip = process.argv[2];
var dev_port = process.argv[3];
Date.prototype.format = function(f) { //날짜, 시간을 표현하기 위한 자바스크립트 함수
    if (!this.valueOf()) return " ";
 
    var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    var d = this;
     
    return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|ms|a\/p)/gi, function($1) {
        switch ($1) {
            case "yyyy": return d.getFullYear();
            case "yy": return (d.getFullYear() % 1000).zf(2);
            case "MM": return (d.getMonth() + 1).zf(2);
            case "dd": return d.getDate().zf(2);
            case "E": return weekName[d.getDay()];
            case "HH": return d.getHours().zf(2);
            case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
            case "mm": return d.getMinutes().zf(2);
            case "ss": return d.getSeconds().zf(2);
            case "ms": return d.getMilliseconds().zf(3);
            case "a/p": return d.getHours() < 12 ? "오전" : "오후";
            default: return $1;
        }
    });
};
 
String.prototype.string = function(len){var s = '', i = 0; while (i++ < len) { s += this; } return s;};
String.prototype.zf = function(len){return "0".string(len - this.length) + this;};
Number.prototype.zf = function(len){return this.toString().zf(len);};

var dt = new Date().format("yyyyMMdd-hh시mm분ss초ms"); //출력되는 패킷 파일의 시간을 제목으로 나타내기 위함.
var title = './packetdump_'+dt+'.txt'; //각 출력 파일의 구분자로 시간을 사용한다.
var dut = net.connect({ port: dev_port, host: dev_ip }); //DUT의 주소로 TCP 연결
var server = net.createServer(); //넷티마이저의 연결을 수용할 서버 생성
var serverSocket;
if(process.argv[3] == null){
    console.log("Usage : node Async_packetdump [ip addr] [port addr]")
}
server.on('connection', function (socket) { //넷티마이저와 연결
	setTimeout(function(){
		process.exit();
	}, 1002000);
    socket.on("data", function (data) { //소켓으로부터 메시지가 들어오는 이벤트
    	var d = new Date().format("hh시mm분ss초ms"); //메시지 도착시간 표시
        dut.write(data); //메시지를 그대로 DUT에게 전달합니다.
        //console.log('FieldtestS/W('+d+'):' + data); //주석을 풀면 콘솔창을 통해 data를 출력 가능.
        fs.writeFile(title,'FieldtestS/W('+d+') : '+data.toString('hex')+"\n",{flag:'a'});
        //출력 파일의 다음 행에 메시지를 덧붙이기.
    });
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
    var d = new Date().format("hh시mm분ss초ms");
    //console.log('device('+d+'):' + data); 
    serverSocket.write(data);
    fs.writeFile(title,'device('+d+') : '+data.toString('hex')+"\n",{flag:'a'});
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
