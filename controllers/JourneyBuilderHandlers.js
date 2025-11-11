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
            let decodedArgs = decoded.inArguments;

            const subscriberKey = decoded.keyValue;
            const pushId = decodedArgs[0].Msg_Push_Element;
            const pushName = decodedArgs[0].Push_Name || '';
            const contactId = decodedArgs[1].ContactID_relazionato;

            // Ottieni token SFMC
            const token = await getTokenSFMC();
            if (!token) {
                console.error('Unable to retrieve SFMC token');
                return 500;
            }

            // Prepara il body per inserire nella Data Extension
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

            // Inserisci nella Data Extension
            const deKey = env.DE_KEY; // Assicurati che DE_KEY sia impostato nelle variabili di ambiente
            const resDE = await axios.post(env.API_URL, body, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('*** Inserted into DE ***', resDE.status);

            // Log dell'operazione
            let logReq = {
                SubscriberKey: subscriberKey,
                Msg_Push_Element: pushId,
                Push_Name: pushName,
                JourneyId: decoded.journeyId,
                ActivityId: decoded.activityId,
                ActivityObjectID: decoded.activityObjectID,
                Status: resDE.status,
                Error_Message: ''
            };

            await logPushHistory(logReq, null, resDE.status);

            return resDE.status;
        } else {
            console.error('inArguments invalid.');
            return 400;
        }
    } catch (e) {
        console.error(e);
        return 500;
    }
};