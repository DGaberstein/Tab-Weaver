const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  entry: {
    'tab-weaver-background': './src/background/background.js',
    'tab-weaver-content-script': './src/content/content-script.js',
    'tab-weaver-popup': './src/popup/popup.js',
    'tab-weaver-options': './src/options/options.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: (pathData) => {
      // Use descriptive filenames for manifest-referenced files
      if (pathData.chunk.name === 'tab-weaver-background') {
        return 'background.js';
      }
      if (pathData.chunk.name === 'tab-weaver-content-script') {
        return 'content-script.js';
      }
      if (pathData.chunk.name === 'tab-weaver-popup') {
        return isDevelopment ? 'popup.js' : 'popup.[contenthash:8].js';
      }
      if (pathData.chunk.name === 'tab-weaver-options') {
        return isDevelopment ? 'options.js' : 'options.[contenthash:8].js';
      }
      // Fallback for other files
      return isDevelopment ? '[name].js' : '[name].[contenthash:8].js';
    },
    chunkFilename: isDevelopment ? '[id].js' : '[id].[contenthash:8].js',
    clean: true, // Clean all files on each build
    environment: {
      arrowFunction: true,
      const: true,
      destructuring: true,
      forOf: true,
      module: true
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { 
                targets: { chrome: '120' },
                modules: false,
                useBuiltIns: 'usage',
                corejs: '3'
              }],
              ['@babel/preset-react', { 
                runtime: 'automatic',
                development: process.env.NODE_ENV === 'development'
              }]
            ]
          }
        }
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              api: 'modern-compiler', // Use latest Sass API
              sassOptions: {
                outputStyle: 'compressed'
              }
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    new HtmlWebpackPlugin({
      template: './src/popup/popup.html',
      filename: 'popup.html',
      chunks: ['tab-weaver-popup']
    }),
    new HtmlWebpackPlugin({
      template: './src/options/options.html',
      filename: 'options.html',
      chunks: ['tab-weaver-options']
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'icons', to: 'icons' }
      ]
    })
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'tab-weaver-vendors',
          chunks: 'all',
          priority: 10
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'tab-weaver-react',
          chunks: 'all',
          priority: 20
        }
      }
    },
    usedExports: true,
    sideEffects: false,
    moduleIds: 'deterministic',
    runtimeChunk: false
  }
};