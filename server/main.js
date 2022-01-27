//module
const express = require('express')
const path = require('path')
const livereload = require("livereload");
const connectLiveReload = require("connect-livereload");

// configuration
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

// prepare server
const app = express();
app.use(connectLiveReload()); // Allow Auto Reload on change on server side
app.use(express.static(DIST_DIR)); // serve static

//start server
app.listen(port, () => console.log('listening on port: ' + port)) 
