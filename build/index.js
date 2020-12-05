"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
var app = express_1.default();
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
var port = process.env.PORT || 4000;
app.get('/', function (req, res) {
    console.log(req)
    res.send('Hello, World!');
});
app.post('/', function (req, res) {
    console.log(req)
    res.send('Hello, World!');
});
app.listen(port, function () {
    return console.log("server is listening on " + port);
});
