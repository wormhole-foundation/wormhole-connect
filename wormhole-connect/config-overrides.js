const webpack = require("webpack");

module.exports = function override(config, env) {
  return {
    ...config,
    module: {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.js$/,
          enforce: "pre",
          use: ["source-map-loader"],
          resolve: {
            fullySpecified: false,
          }
        },
        {
          test: /\.wasm$/,
          type: "webassembly/async",
        },
      ],
    },
    plugins: [
      ...config.plugins,
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
        process: "process/browser",
      }),
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
    ],
    resolve: {
      ...config.resolve,
      fallback: {
        crypto: "crypto-browserify",
        http: "stream-http",
        https: "https-browserify",
        stream: "stream-browserify",
        buffer: "buffer",
        url: "url",
        os: "os-browserify/browser",
      },
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          default: false
        }
      },
      runtimeChunk: false
    },
    experiments: {
      asyncWebAssembly: true,
    },
    ignoreWarnings: [/Failed to parse source map/],
  };
};