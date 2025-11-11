const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const env = process.env;

const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(bodyParser.raw({type: 'application/jwt'}));

app.use(express.static(path.join(__dirname, 'public')));


app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));

/*
app.get('/', async (req, res) => {
    res.render('index');
});
*/

const JbRoutes = require('./routes/index');
app.use('/jb', JbRoutes);


app.listen(env.PORT, () => {
    console.log("Server listening on port: " + env.PORT);
});