const express = require('express');
const jb = require('../controllers/JourneyBuilderHandlers');
const {getPushSFMC} = require('../functions/global-functions');

const router = express.Router();

router.post('/save', async (req, res) => {
    let save = await jb.JourneyBuilderSave();
    //console.log(req.body);
    res.sendStatus(save);
});

router.post('/validate', async (req, res) => {
    let validate = await jb.JourneyBuilderValidate();
    //console.log(req.body);
    res.sendStatus(validate);
});

router.post('/publish', async (req, res) => {
    let publish = await jb.JourneyBuilderPublish();
    //console.log(req.body);
    res.sendStatus(publish);
});

router.post('/execute', async (req, res) => {
    let execute = await jb.JourneyBuilderExecute(req.body);
    res.sendStatus(execute);
});

router.post('/getPush', async (req, res) => {
    let getPush = await getPushSFMC(req.body);
    res.send(JSON.stringify(getPush));
});

module.exports = router;