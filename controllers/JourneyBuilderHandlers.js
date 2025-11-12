const axios = require('axios');
const env = process.env;
const { JWTdecode, logPushHistory, getTokenSFMCBuChild } = require('../functions/global-functions');

exports.JourneyBuilderSave = async () => 200;
exports.JourneyBuilderValidate = async () => 200;
exports.JourneyBuilderPublish = async () => 200;

exports.JourneyBuilderExecute = async (req) => {
    try {
        const decoded = await JWTdecode(req, env.SFMC_JWT);

        if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
            const decodedArgs = decoded.inArguments;
            const subscriberKey = decoded.keyValue;
            const pushId = decodedArgs[0].Msg_Push_Element;
            const pushName = decodedArgs[0].Push_Name || '';
            const contactId = decodedArgs[1].ContactID_relazionato;

            // Respond immediately to Journey Builder to avoid timeout
            setImmediate(async () => {
                try {
                    const token = await getTokenSFMCBuChild();
                    if (!token) {
                        console.error('Unable to retrieve SFMC token');
                        // Log error in logPushHistory
                        await logPushHistory({
                            SubscriberKey: subscriberKey,
                            Msg_Push_Element: pushId,
                            Push_Name: pushName,
                            JourneyId: decoded.journeyId,
                            ActivityId: decoded.activityId,
                            ActivityObjectID: decoded.activityObjectID,
                            Status: 'ERROR',
                            Error_Message: 'Token retrieval failed'
                        }, null, 'ERROR');
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

                    const url = `${env.SFMC_ROOT_REST}/data/v1/async/dataextensions/key:${env.DE_KEY}/rows`;

                    try {
                        const resDE = await axios.post(url, body, {
                            headers: {
                                'Authorization': `Bearer ${token.token}`,
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

                    } catch (apiError) {
                        console.error('Error inserting into DE:', apiError.message);
                        // Attempt to log error in DE or logPushHistory
                        await logPushHistory({
                            SubscriberKey: subscriberKey,
                            Msg_Push_Element: pushId,
                            Push_Name: pushName,
                            JourneyId: decoded.journeyId,
                            ActivityId: decoded.activityId,
                            ActivityObjectID: decoded.activityObjectID,
                            Status: 'ERROR',
                            Error_Message: apiError.message
                        }, null, 'ERROR');
                    }

                } catch (e) {
                    console.error('Async error:', e);
                    await logPushHistory({
                        SubscriberKey: subscriberKey,
                        Msg_Push_Element: pushId,
                        Push_Name: pushName,
                        JourneyId: decoded.journeyId,
                        ActivityId: decoded.activityId,
                        ActivityObjectID: decoded.activityObjectID,
                        Status: 'ERROR',
                        Error_Message: e.message
                    }, null, 'ERROR');
                }
            });

            return 200; // Immediate response
        } else {
            console.error('inArguments invalid.');
            return 400;
        }
    } catch (e) {
        console.error(e);
        return 500;
    }
};
