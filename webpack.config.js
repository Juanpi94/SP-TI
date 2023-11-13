// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');
const fs = require("fs");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV == 'production';


const stylesHandler = MiniCssExtractPlugin.loader;

const __SOURCE_DIR__ = path.resolve(__dirname, "source") + "/";
const __JS_SOURCE_DIR__ = path.join(__SOURCE_DIR__, "/js");

/**
 * @returns {{[key: string]: string}} The dictionary with the name / path of the files
 */
function getJavascriptFiles() {
    const jsFiles = {};
    /**
     * @type {(dir: string) => void}
     */
    const scanFolder = (dir) => {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                scanFolder(filePath)
            } else if (path.extname(file) === ".js") {
                const fileName = path.parse(file).name;
                if (!fileName.startsWith("_")) {
                    jsFiles[fileName] = filePath;
                }
            }
        }
    }

    scanFolder(__JS_SOURCE_DIR__);
    return jsFiles;
}

const config = {
    entry: getJavascriptFiles(),
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
