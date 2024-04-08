import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import dts from "vite-plugin-dts";
import path from "path";

const resolve = {
  alias: {
    components: path.resolve(__dirname, "./src/components"),
  },
};

const plugins = [
  checker({
    typescript: true,
  }),
  dts({
    insertTypesEntry: true,
  }),
  react(),
  nodePolyfills({
    include: [
      "crypto",
      "http",
      "https",
      "stream",
      "buffer",
      "url",
      "os",
      "zlib",
    ],
    globals: {
      Buffer: true,
    },
  }),
];

let output = {
  assetFileNames: "[name]-[hash][extname]",
  inlineDynamicImports: false,
  exports: "named",
};

let external = [
  // TODO figure out why these have to be here. build fails without it
  "@particle-network/solana-wallet",
  "@particle-network/auth",
];

export default {
  resolve,
  build: {
    outDir: "./build",
    rollupOptions: {
      input: {
        main: "src/index.tsx",
        index: "index.html",
      },
      output,
      external,
    },
  },
  plugins,
};
