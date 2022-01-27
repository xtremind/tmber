//module
const express = require('express')
const path = require('path')


// configuration
const port = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, '../dist');
// prepare server
const app = express()
app.use(express.static(DIST_DIR));

//start server
app.listen(port, () => console.log('listening on port ' + port))
