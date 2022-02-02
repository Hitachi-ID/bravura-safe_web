const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackInjector = require("html-webpack-injector");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { AngularWebpackPlugin } = require("@ngtools/webpack");
const pjson = require("./package.json");
const config = require("./config.js");

const ENV = process.env.ENV == null ? "development" : process.env.ENV;
const NODE_ENV = process.env.NODE_ENV == null ? "development" : process.env.NODE_ENV;

const envConfig = config.load(ENV);
config.log(envConfig);

const moduleRules = [
  {
    test: /\.ts$/,
    enforce: "pre",
    loader: "tslint-loader",
  },
  {
    test: /\.(html)$/,
    loader: "html-loader",
  },
  {
    test: /.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
    exclude: /loading(|-white).svg/,
    generator: {
      filename: "fonts/[name].[ext]",
    },
    type: "asset/resource",
  },
  {
    test: /\.(jpe?g|png|gif|svg)$/i,
    exclude: /.*(fontawesome-webfont)\.svg/,
    generator: {
      filename: "images/[name].[ext]",
    },
    type: "asset/resource",
  },
  {
    test: /\.scss$/,
    use: [
      {
        loader: MiniCssExtractPlugin.loader,
      },
      "css-loader",
      "sass-loader",
    ],
  },
  {
    test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
    loader: "@ngtools/webpack",
  },
];

const plugins = [
  new CleanWebpackPlugin(),
  // ref: https://github.com/angular/angular/issues/20357
  new webpack.ContextReplacementPlugin(
    /\@angular(\\|\/)core(\\|\/)fesm5/,
    path.resolve(__dirname, "./src")
  ),
  new HtmlWebpackPlugin({
    template: "./src/index.html",
    filename: "index.html",
    chunks: ["theme_head", "app/polyfills", "app/vendor", "app/main"],
  }),
  new HtmlWebpackInjector(),
  new HtmlWebpackPlugin({
    template: "./src/connectors/duo.html",
    filename: "duo-connector.html",
    chunks: ["connectors/duo"],
  }),
  new HtmlWebpackPlugin({
    template: "./src/connectors/u2f.html",
    filename: "u2f-connector.html",
    chunks: ["connectors/u2f"],
  }),
  new HtmlWebpackPlugin({
    template: "./src/connectors/webauthn.html",
    filename: "webauthn-connector.html",
    chunks: ["connectors/webauthn"],
  }),
  new HtmlWebpackPlugin({
    template: "./src/connectors/webauthn-mobile.html",
    filename: "webauthn-mobile-connector.html",
    chunks: ["connectors/webauthn"],
  }),
  new HtmlWebpackPlugin({
    template: "./src/connectors/webauthn-fallback.html",
    filename: "webauthn-fallback-connector.html",
    chunks: ["connectors/webauthn-fallback"],
  }),
  new HtmlWebpackPlugin({
    template: "./src/connectors/sso.html",
    filename: "sso-connector.html",
    chunks: ["connectors/sso"],
  }),
  new HtmlWebpackPlugin({
    template: "./src/connectors/captcha.html",
    filename: "captcha-connector.html",
    chunks: ["connectors/captcha"],
  }),
  new HtmlWebpackPlugin({
    template: "./src/connectors/captcha-mobile.html",
    filename: "captcha-mobile-connector.html",
    chunks: ["connectors/captcha"],
  }),
  new CopyWebpackPlugin({
    patterns: [
      { from: "./src/.nojekyll" },
      { from: "./src/manifest.json" },
      { from: "./src/favicon.ico" },
      { from: "./src/browserconfig.xml" },
      { from: "./src/app-id.json" },
      { from: "./src/404.html" },
      { from: "./src/404", to: "404" },
      { from: "./src/images", to: "images" },
      { from: "./src/locales", to: "locales" },
      { from: "./src/scripts", to: "scripts" },
      { from: "./node_modules/qrious/dist/qrious.min.js", to: "scripts" },
      { from: "./node_modules/braintree-web-drop-in/dist/browser/dropin.js", to: "scripts" },
      {
        from: "./src/version.json",
        transform(content, path) {
          return content.toString().replace("process.env.APPLICATION_VERSION", pjson.version);
        },
      },
    ],
  }),
  new MiniCssExtractPlugin({
    filename: "[name].[contenthash].css",
    chunkFilename: "[id].[contenthash].css",
  }),
  new webpack.EnvironmentPlugin({
    ENV: ENV,
    NODE_ENV: NODE_ENV === "production" ? "production" : "development",
    APPLICATION_VERSION: pjson.version,
    CACHE_TAG: Math.random().toString(36).substring(7),
    URLS: envConfig["urls"] ?? {},
    STRIPE_KEY: envConfig["stripeKey"] ?? "",
    BRAINTREE_KEY: envConfig["braintreeKey"] ?? "",
    PAYPAL_CONFIG: envConfig["paypal"] ?? {},
  }),
  new webpack.ProvidePlugin({
    process: "process/browser",
  }),
  new AngularWebpackPlugin({
    tsConfigPath: "tsconfig.json",
    entryModule: "src/app/app.module#AppModule",
    sourceMap: true,
  }),
];

// ref: https://webpack.js.org/configuration/dev-server/#devserver
let certSuffix = fs.existsSync("dev-server.local.pem") ? ".local" : ".shared";
const devServer =
  NODE_ENV !== "development"
    ? {}
    : {
        server: {
          type: "https",
          options: {
            key: fs.readFileSync("dev-server" + certSuffix + ".pem"),
            cert: fs.readFileSync("dev-server" + certSuffix + ".pem"),
          },
        },
        // host: '192.168.1.9',
        proxy: {
          "/api": {
            target: envConfig.dev?.proxyApi,
            pathRewrite: { "^/api": "" },
            secure: false,
            changeOrigin: true,
          },
          "/identity": {
            target: envConfig.dev?.proxyIdentity,
            pathRewrite: { "^/identity": "" },
            secure: false,
            changeOrigin: true,
          },
          "/events": {
            target: envConfig.dev?.proxyEvents,
            pathRewrite: { "^/events": "" },
            secure: false,
            changeOrigin: true,
          },
          "/notifications": {
            target: envConfig.dev?.proxyNotifications,
            pathRewrite: { "^/notifications": "" },
            secure: false,
            changeOrigin: true,
          },
        },
        hot: false,
        allowedHosts: envConfig.dev?.allowedHosts ?? "auto",
        client: {
          overlay: {
            errors: true,
            warnings: false,
          },
        },
      };

const webpackConfig = {
  mode: NODE_ENV,
  devtool: "source-map",
  devServer: devServer,
  entry: {
    "app/polyfills": "./src/app/polyfills.ts",
    "app/main": "./src/app/main.ts",
    "connectors/u2f": "./src/connectors/u2f.js",
    "connectors/webauthn": "./src/connectors/webauthn.ts",
    "connectors/webauthn-fallback": "./src/connectors/webauthn-fallback.ts",
    "connectors/duo": "./src/connectors/duo.ts",
    "connectors/sso": "./src/connectors/sso.ts",
    "connectors/captcha": "./src/connectors/captcha.ts",
    theme_head: "./src/theme.js",
  },
  externals: {
    u2f: "u2f",
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: "app/vendor",
          chunks: (chunk) => {
            return chunk.name === "app/main";
          },
        },
      },
    },
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          safari10: true,
        },
      }),
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    symlinks: false,
    modules: [path.resolve("node_modules")],
    fallback: {
      buffer: false,
      util: require.resolve("util/"),
      assert: false,
    },
  },
  output: {
    filename: "[name].[contenthash].js",
    path: path.resolve(__dirname, "build"),
  },
  module: { rules: moduleRules },
  plugins: plugins,
};

module.exports = webpackConfig;
