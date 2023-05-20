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
            console.log(onlineUserInfoMap.get(current_online_user_Token[jsondata.username].token));
            var headers = { Location: "index" }; // 登录成功的跳转
              response.writeHead(301, headers);
              response.end();
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
