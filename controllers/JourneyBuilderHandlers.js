const axios = require('axios');
const env = process.env;
const {JWTdecode, logPushHistory, getTokenSFMCBuChild} = require('../functions/global-functions');
const {WPgetAccessToken, WPexecuteInsert} = require('../functions/wp-config');

exports.JourneyBuilderSave = async () => {
    return 200;
}

exports.JourneyBuilderValidate = async () => {
    return 200;
}

exports.JourneyBuilderPublish = async () => {
    return 200;
}


exports.JourneyBuilderExecute = async (req, res) => {
    try {
        console.log('=== JourneyBuilderExecute CALLED ===');
        const rawJWT = req.body?.jwt || req.body;
        const decoded = await JWTdecode(rawJWT, env.SFMC_JWT_BUCHILD);

        if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
            const decodedArgs = decoded.inArguments;
            const subscriberKey = decoded.keyValue;
            const pushId = decodedArgs[0].Msg_Push_Element;
            const pushName = decodedArgs[0].Push_Name || '';
            const contactId = decodedArgs[1].ContactID_relazionato;

            // Risposta immediata a Journey Builder
            res.sendStatus(200); // ← rispondi subito

            // Async background
            setImmediate(async () => {
                try {
                    const tokenResponse = await getTokenSFMCBuChild();
                    const token = tokenResponse?.token;
                    if (!token) return console.error('Unable to retrieve SFMC token');

                    const body = {
                        items: [{ SubscriberKey: subscriberKey, ContactID_relazionato: contactId, PushID: pushId, PushName: pushName }]
                    };

                    const url = `https://mc9hp147ft752v3mml4vn69cfwm4.rest.marketingcloudapis.com/data/v1/dataextensions/key:${env.DE_KEY}/rows`;
                    const resDE = await axios.post(url, body, {
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        timeout: 8000
                    });

                    console.log('*** Inserted into DE ***', resDE.status);
                    await logPushHistory({
                        SubscriberKey: subscriberKey,
                        Msg_Push_Element: pushId,
                        Push_Name: pushName,
                        JourneyId: decoded.journeyId,
                        ActivityId: decoded.activityId,
                        ActivityObjectID: decoded.activityObjectID,
                        Status: resDE.status,
                        Error_Message: ''
                    }, null, resDE.status);
                } catch (e) {
                    console.error('Async error:', e.response?.data || e);
                }
            });
        } else {
            console.error('inArguments invalid.');
            res.sendStatus(400); // rispondi con 400
        }
    } catch (e) {
        console.error(e);
        res.sendStatus(500); // rispondi con 500
    }
};
