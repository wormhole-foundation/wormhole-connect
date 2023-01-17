const { ProvidePlugin } = require("webpack");

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
      new ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
        process: "process/browser",
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
      },
    },
    experiments: {
      asyncWebAssembly: true,
    },
    ignoreWarnings: [/Failed to parse source map/],
  };
};