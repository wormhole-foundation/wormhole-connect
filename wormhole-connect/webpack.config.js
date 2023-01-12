module.exports = {
  devtool: isDevelopment && "cheap-module-source-map",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "assets/js/[name].[contenthash:8].js",
    publicPath: "/"
  },
  compilerOptions: {
    outDir: "./dist/",
    noImplicitAny: true,
    module: "es6",
    target: "es5",
    jsx: "react",
    allowJs: true,
    moduleResolution: "node",
    sourceMap: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpg|gif|svg)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
            }
          },
        ],
        type: 'javascript/auto'
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    // crypto: require.resolve("crypto-browserify"),
    // http: require.resolve("stream-http"),
    // https: require.resolve("https-browserify"),
    // stream: require.resolve("stream-browserify"),
    // url: require.resolve("url"),
  },
  presets: ['@babel/preset-env'],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
