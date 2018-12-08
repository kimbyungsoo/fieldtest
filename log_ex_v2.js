const net = require('net');
const fs = require('fs');
const moment = require('moment');

let date = moment().format("yyyyMMdd-hh시mm분ss초ms");
let ENV = {
   CONFIG_PACKET: process.argv[4],
   SERVER_CONFIG: {port: process.argv[3], host: process.argv[2]},
   FILE_NAME: './result_emul_' + date + '.txt'
};
let PACKET = {
   INIT: [], REPEAT: []
};
let dut;

if (ENV.FILE_NAME == null) {
   console.log("USAGE : node log_extractor [ip address] [port address] [config filename]");
   process.abort()
}

let fileContent = fs.readFileSync(ENV.CONFIG_PACKET, 'utf8');
let packetList = JSON.parse(fileContent);

for (let packetIndex in packetList) {
   if (packetList.hasOwnProperty(packetIndex)) {
      if (packetList[packetIndex] === 1) {
         PACKET.INIT.push(packetIndex)
      } else {
         PACKET.REPEAT.push(packetIndex)
      }
   }
}

console.log("INPUT PACKET LENGTH   : ", packetList.length);
console.log("INIT PACKET LENGTH    : ", PACKET.INIT.length);
console.log("REPEAT PACKET LENGTH  : ", PACKET.REPEAT.length);
console.log("hello");
let serverConnectionCallback = function () {
   console.log('CLIENT : CONNECTED TO SERVER');
   /*
   let cnt = 0;
   for (let packetIndex in packetList) {
      if (packetList.hasOwnProperty(packetIndex)) {
         if (packetList[packetIndex] === 1) {
            cnt++;
            setTimeout(sendMessage, 250*cnt, packetIndex);
         } else {
            sendMessage(packetIndex);
            setInterval(sendMessage, 1000, packetIndex);
         }
      }
   }
   */
   sendMessage(PACKET.REPEAT[0]);
   setTimeout(sendMessage, 240, PACKET.INIT[0]);
   setTimeout(sendMessage, 340, PACKET.INIT[1]);
   setTimeout(sendMessage, 940, PACKET.INIT[2]);
   setInterval(sendMessageRepeat, 1000);
};

dut = net.connect(ENV.SERVER_CONFIG);

dut.on('connect', serverConnectionCallback);

dut.on('data', function (data) {
   console.log("CLIENT : DATA RECEIVED : ", data.toString());
   let d = moment().format("hh시mm분ss초ms");
   fs.writeFileSync('./logs/' + ENV.FILE_NAME, 'device(' + d + ') : ' + data.toString('hex') + "\n", {flag: 'a'});
});

dut.on('end', function () {
   console.log('CLIENT : DUT DISCONNECTED');
});

dut.on('error', function (err) {
   console.log('CLIENT : DUT : ' + err);
   process.exit();
});

dut.on('timeout', function () {
   console.log('CLIENT : DUT CONNECTION TIMEOUT');
});

function sendMessage(arg) {
   console.log("SEND MESSAGE : ", arg);
   dut.write(Buffer.from(arg, 'hex'));
   let date = moment().format("hh시mm분ss초ms");
   let content = 'FieldtestS/W(' + date + ') : ' + arg + "\n";
   fs.writeFileSync('./logs/' + ENV.FILE_NAME, content, {flag: 'a'});
}
function sendMessageRepeat() {
   sendMessage(PACKET.REPEAT[1]);
   setTimeout(sendMessage,70,PACKET.REPEAT[0]);
}
