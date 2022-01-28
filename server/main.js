// External modules
const express = require('express')
const path = require('path')
const livereload = require("livereload");
const connectLiveReload = require("connect-livereload");

// Internal modules
const logger = require('./utils/logger');
const MainEngine = require('./engine/MainEngine');

// Configuration
const port = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, '../dist');

// Allow Auto Reload on change on client side
const liveReloadServer = livereload.createServer();
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});
liveReloadServer.watch(DIST_DIR);

// Prepare server
const app = express();
app.use(connectLiveReload()); // Allow Auto Reload on change on server side
app.use(express.static(DIST_DIR)); // serve static

// prepare Socket.io Server
const server = require('http').Server(app, {serveClient: false})
const io = require('socket.io')(server)

// Start server 
server.listen(port, () => logger.info('listening on port: ' + port)) 

new MainEngine(io, logger).start();