const HtmlWebPackPlugin = require("html-webpack-plugin");

const path = require("path");
const webpack = require("webpack");

const htmlPlugin = new HtmlWebPackPlugin({
  title: "TMBER",
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
  module: {
    rules: [
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource',
      }
    ]
  },
  resolve: { 
    alias: {
      images: path.resolve(__dirname, './client/src/assets/img'),
      sounds: path.resolve(__dirname, './client/src/assets/snd'),
      jsons: path.resolve(__dirname, './client/src/assets/json'),
      scenes: path.resolve(__dirname, './client/src/scenes'),
      utils: path.resolve(__dirname, './client/src/utils'),
    }, 
    extensions: ["*", ".js", ".jsx"] 
  }
};