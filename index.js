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
  socket.on("praise", function (socketId, msg) {
    if (io.of("/student").connected[socketId]) {
      io.of("/student").connected[socketId].emit("praise", msg);
    }
  }); 

  //Tutor send a text to student
  socket.on("text", function(socketId, msg) {
    if (io.of("/student").connected[socketId]) {
      io.of("/student").connected[socketId].emit("text", msg);
    }
  })

  //Notify of the highlighted Area Event

  socket.on("highlight", function(socketId, offsetX, offsetY, cropWidth, cropHeight) {
    if (io.of("/student").connected[socketId]) {
      io.of("/student").connected[socketId].emit("highlight", offsetX, offsetY, cropWidth, cropHeight);
    }
  })

});


io.of("/student").on("connection", function(socket) {  

  //console Information 
  console.log("student connected");
  console.log("on" + socket.id);

  socket.on("studentOn", function (_) {
    console.log("studentOn" + socket.id);
    io.of("/tutor").emit("studentOn", socket.id);
  });

  //Student Sleep
  socket.on("studentSleep", function(_){
    console.log("student is sleeping");
    io.of("/tutor").emit("studentSleep", socket.id);
  });

  //Student Awake
  socket.on("studentAwake", function(_) {
    console.log("student is awake");
    io.of("/tutor").emit("studentAwake", socket.id);
  });


  

  //Notify that the a certain student is on.
  //io.of("/tutor").emit("studentOn", socket.id);
  
  //Disconnection
  socket.on("disconnect", function(_) {
    console.log("student disconnect");
    //Notify that a certain student is off.
    io.of("/tutor").emit("studentOff", socket.id);
  });


  //Notify the student Client
  socket.emit("student ready");
  //
  //Notify that the circuit has changed
  socket.on("circuitChange", function(imgstring) {
    io.of("/tutor").emit("circuitChange", imgstring, socket.id);
  });


})


http.listen(3000, function() {
  console.log("listening at 3000");
});