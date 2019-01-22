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
  console.log("tutor connected");
  socket.on("disconnect", function(_) {
    console.log("tutor disconnect");
  })
});

io.of("/student").on("connection", function(socket) {
  console.log("student connected");
  socket.on("disconnect", function(_) {
    console.log("student disconnect");
  })
  socket.emit("ready");
  socket.on("circuit change", function(idtype, pos, flag) {
    let id = idtype.split("#")[0];
    let type = "breadboard/resistor_220.svg";
    let posy = pos[pos.length - 1];
    let posx = pos.substring(3, pos.length - 1);
    io.of("/tutor").emit("circuit change", id, type, posx, posy, flag);
  });
})


http.listen(3000, function() {
  console.log("listening at 3000");
});