const axios = require('axios');
const env = process.env;
const {JWTdecode, logPushHistory} = require('../functions/global-functions');
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


exports.JourneyBuilderExecute = async (req) => {
    try {
        const decoded = await JWTdecode(req, env.SFMC_JWT);

        if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
            const decodedArgs = decoded.inArguments;
            const subscriberKey = decoded.keyValue;
            const pushId = decodedArgs[0].Msg_Push_Element;
            const pushName = decodedArgs[0].Push_Name || '';
            const contactId = decodedArgs[1].ContactID_relazionato;

            // Risposta immediata a Journey Builder
            setImmediate(async () => {
                try {
                    const token = await getTokenSFMC();
                    if (!token) {
                        console.error('Unable to retrieve SFMC token');
                        return;
                    }

                    const body = {
                        items: [
                            {
                                SubscriberKey: subscriberKey,
                                ContactID_relazionato: contactId,
                                PushID: pushId,
                                PushName: pushName
                            }
                        ]
                    };

                    const url = `https://${env.MC_SUBDOMAIN}.rest.marketingcloudapis.com/data/v1/async/dataextensions/key:${env.DE_KEY}/rows`;

                    const resDE = await axios.post(url, body, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
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
                    console.error('Async error:', e);
                }
            });

            return 200; // Risposta immediata
        } else {
            console.error('inArguments invalid.');
            return 400;
        }
    } catch (e) {
        console.error(e);
        return 500;
    }
};
