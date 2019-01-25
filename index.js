let express = require("express");
let app = express();
let http = require("http").Server(app);
let fs = require("fs");
let path = require("path");
let bodyParser = require("body-parser");
let multer = require("multer");
let io = require('socket.io')(http);


app.use(express.static(path.join(__dirname, '/')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ dest: '/tmp/' }).array('file'));


//load files and set content type properly
app.all('/', function (req, res) {
  let filename = req.url.split('/')[req.url.split('/').length - 1];
  let suffix = req.url.split('.')[req.url.split('.').length - 1];
  if (suffix === 'css') {
    res.writeHead(200, { 'Content-Type': 'text/css' });
    res.end(get_file_content(path.join(__dirname, '/', filename)));
  }
  else if (suffix === 'js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript' });
    res.end(get_file_content(path.join(__dirname, '/', filename)));
  }
});

function get_file_content(filepath) {
  return fs.readFileSync(filepath);
}


io.of("/tutor").on("connection", function(socket) {
  
  //Console Information
  console.log("tutor connected");
  

  //Disconnection
  socket.on("disconnect", function(_) {
    console.log("tutor disconnect");
  });

  //Notify that a certain student is praised
  socket.on("praise", function (socketId) {
    if (io.of("/student").connected[socketId]) {
      io.of("/student").connected[socketId].emit("studentPraise");
    }
  }); 
});


io.of("/student").on("connection", function(socket) {  

  //console Information 
  console.log("student connected");
  console.log("on" + socket.id);


  //Notify that the a certain student is on.
  io.of("/tutor").emit("studentOn", socket.id);
  
  //Disconnection
  socket.on("disconnect", function(_) {
    console.log("student disconnect");
    //Notify that a certain student is off.
    io.of("/tutor").emit("studentOff", socket.id);
  });


  //Notify the student Client
  socket.emit("student ready");

  //Notify that the circuit has changed
  socket.on("circuitChange", function(idtype, pos, flag) {
    let socketId = socket.id;
    console.log("flag" + flag);
    let id = idtype.split("#")[0];
    let type = idtype.split("#")[1];
    console.log(type);
    if (type == "wire") {
      console.log("hahahahahah");
      io.of("/tutor").emit("wire", idtype, pos, flag, socketId);
      return;
    };
    //TODO:type = "/breadboard/" + type;
    type = "/breadboard/resistor_220.svg";
    let posy = pos[pos.length - 1];
    let posx = pos.substring(3, pos.length - 1);
    io.of("/tutor").emit("circuitChange", id, type, posx, posy, flag, socketId);
  });


})


http.listen(3000, function() {
  console.log("listening at 3000");
});