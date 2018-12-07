const net = require('net');
const fs = require('fs');

const PORT = 9090;
let config_packet = process.argv[2];
let serverSocket;
let packets = {};
let isSocketEnd = false;
let server = net.createServer();
let msg1 = new Buffer([0x12,0x33,0x07,0x00,0x0a,0x10,0x00,0x00,0xc8,0x2b,0x7e]);
let response_msg1 = new Buffer([0x13,0xb3,0x07,0x00,0x0a,0x10,0x00,0x00,0x00,0x00,0x7e]); //123307000a100000c82b7e의 응답

if (process.argv[2] == null) {
	console.log("USAGE : node json_extractor [output_name(anything)]");
	process.exit();
}

let socketDataReceiveCallback = function (data) {
	//data = data.toString('hex')
	if (data.toString('hex') == '123307000a100000c82b7e'){
		serverSocket.write(response_msg1);
	}
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

server.listen(PORT, function () {
	console.log('SERVER : SERVER LISTENING ON PORT : ' + PORT);
});

server.on('connection', function (socket) {
	console.log("SERVER : CONNECTION CREATED");
	isSocketEnd = false;
	serverSocket = null;
	serverSocket = socket;
	serverSocket.on("data", socketDataReceiveCallback);
});

server.on('end', function () {
	console.log('SERVER : CLIENT BYE');
});

server.on('close', function () {
	console.log('SERVER : CLIENT CLOSE');
});

server.on('error', function (err) {
	console.error(err);
});

function writeDataToClient(data, callback) {
	let success = serverSocket.write(data);
	console.log('SERVER : SEND DATA TO CLIENT SUCCESS : ' + String(success).toUpperCase());
	callback();
}