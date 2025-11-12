const axios = require('axios');
const env = process.env;
const { JWTdecode, logPushHistory, getTokenSFMCBuChild } = require('../functions/global-functions');
const { WPgetAccessToken, WPexecuteInsert } = require('../functions/wp-config');

exports.JourneyBuilderSave = async (req, res) => res.sendStatus(200);
exports.JourneyBuilderValidate = async (req, res) => res.sendStatus(200);
exports.JourneyBuilderPublish = async (req, res) => res.sendStatus(200);

exports.JourneyBuilderExecute = async (req, res) => {
  try {
    console.log('=== JourneyBuilderExecute CALLED ===');
    console.log('req.body type:', typeof req.body);
    console.log('req.body keys:', Object.keys(req.body));
    console.log('req.body sample:', JSON.stringify(req.body).substring(0, 300));

    const rawJWT = req.body?.jwt || req.body;
    console.log('Raw JWT:', rawJWT ? 'Present' : 'Missing');
    console.log('Env SFMC_JWT_BUCHILD:', !!env.SFMC_JWT_BUCHILD);

    const decoded = await JWTdecode(rawJWT, env.SFMC_JWT_BUCHILD);
    console.log('Decoded JWT:', decoded);

    if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
      const decodedArgs = decoded.inArguments;
      const subscriberKey = decoded.keyValue;
      const pushId = decodedArgs[0].Msg_Push_Element;
      const pushName = decodedArgs[0].Push_Name || '';
      const contactId = decodedArgs[1].ContactID_relazionato;

      // 🔹 Risposta immediata a Journey Builder (obbligatoria)
      res.status(200).send({ status: 'OK' });

      // 🔹 Operazioni asincrone in background
      setImmediate(async () => {
        try {
          const tokenResponse = await getTokenSFMCBuChild();
          const token = tokenResponse ? tokenResponse.token : null;
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

          const url = `https://mc9hp147ft752v3mml4vn69cfwm4.rest.marketingcloudapis.com/data/v1/dataextensions/key:${env.DE_KEY}/rows`;

          const resDE = await axios.post(url, body, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 8000
          });

          console.log('*** Inserted into DE ***', resDE.status);
          console.log('*** DE Response Data:', resDE.data);

          await logPushHistory(
            {
              SubscriberKey: subscriberKey,
              Msg_Push_Element: pushId,
              Push_Name: pushName,
              JourneyId: decoded.journeyId,
              ActivityId: decoded.activityId,
              ActivityObjectID: decoded.activityObjectID,
              Status: resDE.status,
              Error_Message: ''
            },
            null,
            resDE.status
          );
        } catch (e) {
          console.error('Async error:', e.response?.data || e);
        }
      });
    } else {
      console.error('inArguments invalid.');
      res.status(400).send({ error: 'inArguments invalid' });
    }
  } catch (e) {
    console.error('💥 JourneyBuilderExecute ERROR:', e);
    res.status(500).send({ error: e.message || String(e) });
  }
};
