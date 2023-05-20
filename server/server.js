const { userInfo } = require("os");

var app = require("http").createServer(handler),
  sockets = require("./sockets.js"),
  {log, monitorFunction} = require("./log.js"),
  path = require("path"),
  fs = require("fs"),
  crypto = require("crypto"),
  serveStatic = require("serve-static"),
  upload_file = require("./upload_file.js"),
  createSVG = require("./createSVG.js"),
  templating = require("./templating.js"),
  config = require("./configuration.js"),
  polyfillLibrary = require("polyfill-library"),
  check_output_directory = require("./check_output_directory.js"),
  jwtauth = require("./jwtauth.js");
  jwtBoardName = require("./jwtBoardnameAuth.js");


var MIN_NODE_VERSION = 10.0;

//chatapp
var express = require('express')
    , routes = require('./routes')
    , user = require('./routes/user')
    , http = require('http')
    , path = require('path');

var chatapp = express();

//token验证
const jwt = require('jsonwebtoken');

// 定义中间件函数进行 token 验证
function authenticateToken(req, res, next) {
  // 从请求头部或查询参数中获取 token
  const token = req.headers.authorization || req.query.token;

  // 验证 token 的有效性
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    // 验证 token 并提取用户信息
    const decoded = jwt.verify(token, 'your-secret-key');
    // 在请求中添加用户信息，以便后续处理使用
    req.user = decoded.user;
    // 继续处理下一个中间件或路由处理程序
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// chatapp all environments
chatapp.set('port', process.env.PORT || 4555);
chatapp.set('views', __dirname + '/views');
chatapp.set('view engine', 'jade');
chatapp.use(express.favicon());
chatapp.use(express.logger('dev'));
chatapp.use(express.bodyParser());
chatapp.use(express.cookieParser());
chatapp.use(express.methodOverride());
chatapp.use(chatapp.router);
chatapp.use(express.static(path.join(__dirname, 'public')));

// chatapp development only
if ('development' == chatapp.get('env')) {
  chatapp.use(express.errorHandler());
}

var users = {};//存储在线用户列表的对象

/*chatapp.get('/', function (req, res) {
  if (req.cookies.user == null) {
    res.redirect('/signin');
  } else {
    res.sendfile('client-data/index1.html');
  }
});*/
chatapp.get('/', function (req, res) {
  if (req.cookies.user == null) {
    res.redirect('/signin');
  } else {
    res.sendfile('client-data/index1.html');
  }
});

chatapp.get('/signin',  function (req, res) {
  res.sendfile('client-data/signin.html');
});

chatapp.post('/signin', function (req, res) {
  if (users[req.body.name]) {
    //存在，则不允许登陆
    res.redirect('/signin');
  } else {
    //不存在，把用户名存入 cookie 并跳转到主页
    res.cookie("user", req.body.name, {maxAge: 1000*60*60*24*30});
    res.redirect('/');
  }
});

chatapp.get('/js/jquery.min.js', function(req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  const fs = require('fs');
  const path = require('path');
  const jsFilePath = path.join(__dirname, 'js', 'jquery.min.js');

  fs.readFile(jsFilePath, function(err, data) {
    if (err) {
      console.error('Failed to read JavaScript file:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.send(data);
    }
  });
});

chatapp.get('/js/jquery.cookie.js', function(req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  const fs = require('fs');
  const path = require('path');
  const jsFilePath = path.join(__dirname, 'js', 'jquery.cookie.js');

  fs.readFile(jsFilePath, function(err, data) {
    if (err) {
      console.error('Failed to read JavaScript file:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.send(data);
    }
  });
});

chatapp.get('/socket.io/socket.io.js', function(req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  const fs = require('fs');
  const path = require('path');
  const jsFilePath = 'node_modules/socket.io/client-dist/socket.io.js';

  fs.readFile(jsFilePath, function(err, data) {
    if (err) {
      console.error('Failed to read JavaScript file:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.send(data);
    }
  });
});

chatapp.get('/js/chat.js', function(req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  const fs = require('fs');
  const path = require('path');
  const jsFilePath = path.join(__dirname, 'js', 'chat.js');

  fs.readFile(jsFilePath, function(err, data) {
    if (err) {
      console.error('Failed to read JavaScript file:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.send(data);
    }
  });
});

var server4chat = http.createServer(chatapp);
var temp=require('socket.io')(server4chat);
var io4chat = temp.listen(server4chat);
io4chat.path('/socket.io');
io4chat.sockets.on('connection', function (socket) {

  console.log('WebSocket 连接已打开');

  socket.onclose = function(event) {
    console.log('WebSocket 连接已关闭', event);
  };

  socket.onerror = function(error) {
    console.error('WebSocket 错误', error);
  };

  //有人上线
  socket.on('online', function (data) {
    console.log('有人上线');
    //将上线的用户名存储为 socket 对象的属性，以区分每个 socket 对象，方便后面使用
    socket.name = data.user;
    //users 对象中不存在该用户名则插入该用户名
    if (!users[data.user]) {
      users[data.user] = data.user;
    }
    //向所有用户广播该用户上线信息
    console.log(users[data.user]);
    io4chat.sockets.emit('online', {users: users, user: data.user});
  });

  //有人发话
  socket.on('say', function (data) {
    if (data.to == 'all') {
      //向其他所有用户广播该用户发话信息
      socket.broadcast.emit('say', data);
    } else {
      //向特定用户发送该用户发话信息
      //clients 为存储所有连接对象的数组
      var clients = io.sockets.clients();
      //遍历找到该用户
      clients.forEach(function (client) {
        if (client.name == data.to) {
          //触发该用户客户端的 say 事件
          client.emit('say', data);
        }
      });
    }
  });

  //有人下线
  socket.on('disconnect', function() {
    //若 users 对象中保存了该用户名
    if (users[socket.name]) {
      //从 users 对象中删除该用户名
      delete users[socket.name];
      //向其他所有用户广播该用户下线信息
      socket.broadcast.emit('offline', {users: users, user: socket.name});
    }
  });
});

server4chat.listen(chatapp.get('port'), function(){
  console.log('Express server listening on port ' + chatapp.get('port'));
});

if (parseFloat(process.versions.node) < MIN_NODE_VERSION) {
  console.warn(
    "!!! You are using node " +
      process.version +
      ", wbo requires at least " +
      MIN_NODE_VERSION +
      " !!!"
  );
}

check_output_directory(config.HISTORY_DIR);

var io = sockets.start(app);
upload_file.set(io);

app.listen(config.PORT, config.HOST);
log("server started", { port: config.PORT });

var CSP =
  "default-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:";

var fileserver = serveStatic(config.WEBROOT, {
  maxAge: 2 * 3600 * 1000,
  setHeaders: function (res) {
    res.setHeader("X-UA-Compatible", "IE=Edge");
    res.setHeader("Content-Security-Policy", CSP);
  },
});

var errorPage = fs.readFileSync(path.join(config.WEBROOT, "error.html"));
function serveError(request, response) {
  return function (err) {
    log("error", { error: err && err.toString(), url: request.url });
    response.writeHead(err ? 500 : 404, { "Content-Length": errorPage.length });
    response.end(errorPage);
  };
}

/**
 * Write a request to the logs
 * @param {import("http").IncomingMessage} request
 */
function logRequest(request) {
  log("connection", {
    ip: request.socket.remoteAddress,
    original_ip:
      request.headers["x-forwarded-for"] || request.headers["forwarded"],
    user_agent: request.headers["user-agent"],
    referer: request.headers["referer"],
    language: request.headers["accept-language"],
    url: request.url,
  });
}

/**
 * @type {import('http').RequestListener}
 */
function handler(request, response) {
  try {
    handleRequestAndLog(request, response);
  } catch (err) {
    console.trace(err);
    response.writeHead(500, { "Content-Type": "text/plain" });
    response.end(err.toString());
  }
}

const boardTemplate = new templating.BoardTemplate(
  path.join(config.WEBROOT, "board.html")
);
const indexTemplate = new templating.Template(
  path.join(config.WEBROOT, "index.html")
);

const loginTemplate = new templating.Template(
  path.join(config.WEBROOT, "login.html")
);

/**
 * Throws an error if the given board name is not allowed
 * @param {string} boardName
 * @throws {Error}
 */
function validateBoardName(boardName) {
  if (/^[\w%\-_~()]*$/.test(boardName)) return boardName;
  throw new Error("Illegal board name: " + boardName);
}

var current_online_user_Token = {

}

const onlineUserInfoMap = new Map();

function getOnlineUserInfo(token) {
  const userInfo = onlineUserInfoMap.get(token);
  return userInfo ? userInfo : -1;
}

/**
 * @type {import('http').RequestListener}
 */
function handleRequest(request, response) {
  var parsedUrl = new URL(request.url, 'http://wbo/');
  var parts = parsedUrl.pathname.split("/");

  if (parts[0] === "") parts.shift();

  var fileExt = path.extname(parsedUrl.pathname);
  var staticResources = ['.js','.css', '.svg', '.ico', '.png', '.jpg', 'gif'];
  // If we're not being asked for a file, then we should check permissions.
  var isModerator = false;
  if(!staticResources.includes(fileExt)) {
    isModerator = jwtauth.checkUserPermission(parsedUrl);
  }

  switch (parts[0]) {
    case "login":
      if(request.method != "POST"){
        response.end('<head><meta charset="utf-8" /></head><p>请求方法错误</p>');
      }
      var data = ''
      request.on('data',function(d){
        data += d
      })
      request.on('end',function(){
        console.log(data);
        var jsondata = require('querystring').parse(data);
        console.log('LOGIN REQUEST'+  JSON.stringify(jsondata));
        fs.readFile(path.join(__dirname,'..','server-data','user-list.json'),(err,data) => {
          if(err)
            console.log(err);
          let userlist = JSON.parse(data.toString());
          if(userlist && userlist[jsondata.username] && userlist[jsondata.username].password == jsondata.password){
            current_online_user_Token[jsondata.username] = {
              username: jsondata.username,
              password: jsondata.password,
              Token:  crypto
              .randomBytes(32)
              .toString("base64")
              .replace(/[^\w]/g, "-"),
              nickname: userlist[jsondata.username].nickname
            }

            console.log({token:current_online_user_Token[jsondata.username].Token});
            fs.readFile(path.join(__dirname, '..', 'client-data', 'user-token.json'), (err, Data) => {
              if (err)
                console.log(err);
              tokens = JSON.parse(Data.toString());
              if (tokens && tokens[userlist[jsondata.username].nickname]) {
                console.log('Existed token')
              }
              tokens[userlist[jsondata.username].nickname] = {
                nickname: userlist[jsondata.username].nickname,
                token: current_online_user_Token[jsondata.username].Token
              }
              fs.writeFile(path.join(__dirname,'..','client-data','user-token.json'), JSON.stringify(tokens), 'utf8', (err) => {
                console.log('Write succeed', err);
              })
            })
            onlineUserInfoMap.set(current_online_user_Token[jsondata.username].token, {
              "username": current_online_user_Token[jsondata.username].username,
              "password": current_online_user_Token[jsondata.username].password,
              "nickname": current_online_user_Token[jsondata.username].nickname
            });
            console.log({ token: current_online_user_Token[jsondata.username].Token });
            var headers = { Location: "index" }; // 登录成功的跳转
              response.setHeader("Content-Type", "application/json");
              response.writeHead(301, headers);
              response.end(JSON.stringify({ token: current_online_user_Token[jsondata.username].Token }));
          }
          else{
            response.end('<head><meta charset="utf-8" /></head><p>登录失败</p>');
          }
        })
      })
      break;
    case "regist":
      if(request.method != "POST"){
        response.end('<head><meta charset="utf-8" /></head><p>请求方法错误</p>');
      }
      var data = ''
      request.on('data',function(d){
        data += d
      })
      request.on('end',function(){
        var jsondata = require('querystring').parse(data);
        console.log('REGIST REQUEST'+ JSON.stringify(jsondata));
        var userlist;
        console.log(path.join(__dirname,'..','server-data','user-list.json'))
        fs.readFile(path.join(__dirname,'..','server-data','user-list.json'), (err,data) => {
          if(err)
            console.log(err);
          console.log('test');
          console.log(data.toString());
          userlist = JSON.parse(data.toString());
          console.log(userlist)
          if(userlist && userlist[jsondata.username]){
            response.end('<head><meta charset="utf-8" /></head><p>用户已存在</p>');
          }
          userlist[jsondata.username] = {
            username: jsondata.username,
            password: jsondata.password,
            nickname: jsondata.nickname
          }
          console.log(userlist);
          fs.writeFile(path.join(__dirname,'..','server-data','user-list.json'), JSON.stringify(userlist), 'utf8', (err) => {
            console.log('注册成功', err);
          })
          var headers = { Location: "/registSuccess" }; // 登录成功的跳转
          response.writeHead(301, headers);
          response.end();
        })
        })
      break;
    case "boards":
      // "boards" refers to the root directory
      if (parts.length === 1) {
        // '/boards?board=...' This allows html forms to point to boards
        var boardName = parsedUrl.searchParams.get("board") || "anonymous";
        jwtBoardName.checkBoardnameInToken(parsedUrl, boardName);
        var headers = { Location: "boards/" + encodeURIComponent(boardName) };
        response.writeHead(301, headers);
        response.end();
      } else if (parts.length === 2 && parsedUrl.pathname.indexOf(".") === -1) {
        var boardName = validateBoardName(parts[1]);
        jwtBoardName.checkBoardnameInToken(parsedUrl, boardName);
        boardTemplate.serve(request, response, isModerator);
        // If there is no dot and no directory, parts[1] is the board name
      } else {
        request.url = "/" + parts.slice(1).join("/");
        fileserver(request, response, serveError(request, response));
      }
      break;

    case "download":
        var boardName = validateBoardName(parts[1]),
          history_file = path.join(
            config.HISTORY_DIR,
            "board-" + boardName + ".json"
          );
        jwtBoardName.checkBoardnameInToken(parsedUrl, boardName);
        if (parts.length > 2 && /^[0-9A-Za-z.\-]+$/.test(parts[2])) {
          history_file += "." + parts[2] + ".bak";
        }
        log("download", { file: history_file });
        fs.readFile(history_file, function (err, data) {
          if (err) return serveError(request, response)(err);
          response.writeHead(200, {
            "Content-Type": "application/json",
            "Content-Disposition": 'attachment; filename="' + boardName + '.wbo"',
            "Content-Length": data.length,
          });
          response.end(data);
        });
      break;

    case "export":
    case "preview":
        var boardName = validateBoardName(parts[1]),
          history_file = path.join(
            config.HISTORY_DIR,
            "board-" + boardName + ".json"
          );
        jwtBoardName.checkBoardnameInToken(parsedUrl, boardName);
        response.writeHead(200, {
          "Content-Type": "image/svg+xml",
          "Content-Security-Policy": CSP,
          "Cache-Control": "public, max-age=30",
        });
        var t = Date.now();
        createSVG
          .renderBoard(history_file, response)
          .then(function () {
            log("preview", { board: boardName, time: Date.now() - t });
            response.end();
          })
          .catch(function (err) {
            log("error", { error: err.toString(), stack: err.stack });
            response.end("<text>Sorry, an error occured</text>");
          });
      break;

    case "random":
      var name = crypto
        .randomBytes(32)
        .toString("base64")
        .replace(/[^\w]/g, "-");
      response.writeHead(307, { Location: "boards/" + name });
      response.end(name);
      break;

    case "polyfill.js": // serve tailored polyfills
    case "polyfill.min.js":
      polyfillLibrary
        .getPolyfillString({
          uaString: request.headers["user-agent"],
          minify: request.url.endsWith(".min.js"),
          features: {
            default: { flags: ["gated"] },
            es5: { flags: ["gated"] },
            es6: { flags: ["gated"] },
            es7: { flags: ["gated"] },
            es2017: { flags: ["gated"] },
            es2018: { flags: ["gated"] },
            es2019: { flags: ["gated"] },
            "performance.now": { flags: ["gated"] },
          },
        })
        .then(function (bundleString) {
          response.setHeader(
            "Cache-Control",
            "private, max-age=172800, stale-while-revalidate=1728000"
          );
          response.setHeader("Vary", "User-Agent");
          response.setHeader("Content-Type", "application/javascript");
          response.end(bundleString);
        });
      break;
    
    case "registSuccess":
    case "": // login Page
      logRequest(request);
        loginTemplate.serve(request, response);
        break;

    case "index": // Index page
      logRequest(request);
        indexTemplate.serve(request, response);
      break;

    default:
      fileserver(request, response, serveError(request, response));
  }
}

const handleRequestAndLog = monitorFunction(handleRequest);
module.exports = app;
