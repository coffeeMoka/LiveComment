const nodeExternals = require("webpack-node-externals");

const clientConfig = {
  mode: "development",
  entry: {
    client: "./src/client/index.ts",
  },
  output: {
    filename: "[name].js",
    path: `${__dirname}/public/js`,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: "/node_modules/",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
};

const serverConfig = {
  mode: "development",
  entry: {
    server: "./src/server/app.ts",
  },
  target: "node",
  node: {
    __dirname: false,
    __filename: false,
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: "/node_modules/",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
};

module.exports = [clientConfig, serverConfig];
