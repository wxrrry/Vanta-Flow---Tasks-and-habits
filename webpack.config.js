const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');

/** Копирует manifest, sw и icons из public/ в dist после сборки */
class CopyPublicAssetsPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('CopyPublicAssetsPlugin', (compilation, callback) => {
      const outDir = compiler.options.output.path;
      const publicDir = path.join(__dirname, 'public');
      const copyFile = (name) => {
        const src = path.join(publicDir, name);
        const dest = path.join(outDir, name);
        if (fs.existsSync(src)) {
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.copyFileSync(src, dest);
        }
      };
      try {
        copyFile('manifest.webmanifest');
        copyFile('sw.js');
        const iconsDir = path.join(publicDir, 'icons');
        const outIcons = path.join(outDir, 'icons');
        if (fs.existsSync(iconsDir)) {
          if (!fs.existsSync(outIcons)) fs.mkdirSync(outIcons, { recursive: true });
          for (const f of fs.readdirSync(iconsDir)) {
            fs.copyFileSync(path.join(iconsDir, f), path.join(outIcons, f));
          }
        }
      } catch (e) {
        console.warn('CopyPublicAssetsPlugin:', e.message);
      }
      callback();
    });
  }
}

module.exports = (env = {}) => {
  const forElectron = Boolean(env.electron);

  return {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
    publicPath: forElectron ? './' : '/',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new CopyPublicAssetsPlugin(),
  ],
  devServer: {
    static: [
      { directory: path.join(__dirname, 'dist'), publicPath: '/' },
      { directory: path.join(__dirname, 'public'), publicPath: '/', watch: true },
    ],
    port: 3000,
    open: true,
  },
  };
};
