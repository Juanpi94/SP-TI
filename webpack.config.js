// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV == 'production';


const stylesHandler = MiniCssExtractPlugin.loader;

const __SOURCE_DIR__ = path.resolve(__dirname, "source") + "/";

const config = {
    entry: {
        main: __SOURCE_DIR__ + "js/main.js",
        table: __SOURCE_DIR__ + "js/table.js",
        report: __SOURCE_DIR__ + "js/report.js",
        traslado: __SOURCE_DIR__ + "js/tramites/traslado.js"

    },
    output: {
        path: path.resolve(__dirname, 'src/backend/static/js'),
        filename: "[name].bundle.js"
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "../css/[name].css",
        }),

        // Add your plugins here
        // Learn more about plugins from https://webpack.js.org/configuration/plugins/
    ],
    module: {
        rules: [
            {
                test: /\source\/.(js|jsx)$/i,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.scss$/i,
                use: [stylesHandler, 'css-loader', 'postcss-loader', 'sass-loader'],
            },
            {
                test: /\.css$/i,
                use: [stylesHandler, 'css-loader', 'postcss-loader'],
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
                type: 'asset',
            },

            // Add your rules for custom modules here
            // Learn more about loaders from https://webpack.js.org/loaders/
        ],
    },
};

module.exports = () => {
    if (isProduction) {
        config.mode = 'production';


    } else {
        config.mode = 'development';
    }
    return config;
};
