Date.prototype.format = function (f) {
   if (!this.valueOf()) return " ";

   var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
   var d = this;

   return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|ms|a\/p)/gi, function ($1) {
      switch ($1) {
         case "yyyy":
            return d.getFullYear();
         case "yy":
            return (d.getFullYear() % 1000).zf(2);
         case "MM":
            return (d.getMonth() + 1).zf(2);
         case "dd":
            return d.getDate().zf(2);
         case "E":
            return weekName[d.getDay()];
         case "HH":
            return d.getHours().zf(2);
         case "hh":
            return ((h = d.getHours() % 12) ? h : 12).zf(2);
         case "mm":
            return d.getMinutes().zf(2);
         case "ss":
            return d.getSeconds().zf(2);
         case "ms":
            return d.getMilliseconds().zf(3);
         case "a/p":
            return d.getHours() < 12 ? "오전" : "오후";
         default:
            return $1;
      }
   });
};
String.prototype.string = function (len) {
   var s = '', i = 0;
   while (i++ < len) {
      s += this;
   }
   return s;
};
String.prototype.zf = function (len) {
   return "0".string(len - this.length) + this;
};
Number.prototype.zf = function (len) {
   return this.toString().zf(len);
};

const SERVER_PORT = 9090;
const LINE_BY_LINE_OPTIONS = {
   encoding: 'utf8',
   skipEmptyLines: true
};

const net = require('net');
const LineByLineReader = require('line-by-line');
const server = net.createServer();
let lineReader;

function timeDifference(a, b) {
   if (a === "start") {
      return 0
   }
   else {
      subHour = parseInt(b.slice(0, 2)) - parseInt(a.slice(0, 2));
      subMinute = parseInt(b.slice(3, 5)) - parseInt(a.slice(3, 5));
      subSecond = parseInt(b.slice(6, 8)) - parseInt(a.slice(6, 8));
      subMillisecond = parseInt(b.slice(9, 12)) - parseInt(a.slice(9, 12));

      if (subHour !== 0) {
         subMinute += subHour * 60;
      }

      if (subMinute !== 0) {
         subSecond += subMinute * 60;
      }

      if (subSecond !== 0) {
         subMillisecond += subSecond * 1000;
         //console.log("초차 : " + subSecond);
      }
      return subMillisecond
   }
}

let fileName, buffer;
let subHour, subMinute, subSecond, subMillisecond, nowTime, milliSecond, preTime = "start";
let socket;
let startime, endtime;

// 파일명 체크
if (process.argv[2] == null) {
   console.log("USAGE : node virtual_DUT [file name]");
   return;
}

fileName = './' + process.argv[2];

// 데이터 수신
let socketReceiveDataCallback = function (data) {
   //넷티마이저의 패킷이 들어온 경우
   //지금 에뮬이 안된다면 넷티가 보내는 패킷마다 이벤트 처리를 해줘야한다.
   let d = new Date().format("hh시mm분ss초ms");
   //console.log('FIELD TEST S/W(' + d + '):' + data.toString('hex'));
};

let lineReadCallback = function (line) {
   lineReader.pause();
   buffer = line.split(' : ');
   if (buffer[0].slice(buffer[0].length * (-1), -14) === 'device') {
      nowTime = buffer[0].slice(7, 19);
      milliSecond = timeDifference(preTime, nowTime);
      //console.log("RESULT : ", Buffer.from(buffer[1], 'hex'));
      socket.write(Buffer.from(buffer[1], 'hex'));
      preTime = nowTime;
   }
   setTimeout(function () {
      lineReader.resume();
   }, milliSecond);
};

let lineReadEndCallback = function (end) {
   console.log("END OF THE FILE, DISCONNECT WITH NETIMIZER");
    console.timeEnd('alpha');
    process.exit();
};

let lineReadErrorCallback = function (err) {
   console.error(err);
};


server.listen(SERVER_PORT, function () {
   console.log('LISTENING ON PORT : ' + SERVER_PORT);
});

server.on('close', function () {
   console.log('CLIENT CLOSED');
});

server.on('error', function (error) {
   console.error(error)
});

server.on('connection', function (temp_socket) {
   console.log("CONNECTION");
   socket = temp_socket;
   lineReader = new LineByLineReader(fileName, LINE_BY_LINE_OPTIONS);
   console.time('alpha');
   lineReader.on('error', lineReadErrorCallback);
   lineReader.on('line', lineReadCallback);
   lineReader.on('end', lineReadEndCallback);
   socket.on("data", socketReceiveDataCallback);
});