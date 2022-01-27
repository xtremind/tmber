const HtmlWebPackPlugin = require("html-webpack-plugin");

const path = require("path");
const webpack = require("webpack");

const htmlPlugin = new HtmlWebPackPlugin({
  template: "./client/public/index.html",
  filename: "./index.html",
});

module.exports = {
  entry: "./client/src/index.js",
  mode: "development",
  output: {
    path: path.join(__dirname, "dist/"),
    filename: "bundle.js",
    publicPath: '/'
  },
  plugins: [
    htmlPlugin, 
    new webpack.HotModuleReplacementPlugin()
  ],
  module: {},
  resolve: { 
    alias: {

    }, 
    extensions: ["*", ".js", ".jsx"] 
  }
};