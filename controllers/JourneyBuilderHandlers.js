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
    try{
        const decoded = await JWTdecode(req, env.SFMC_JWT);

        if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
            
            let decodedArgs = decoded.inArguments;
            
            if(decodedArgs){

                let res;
                let inputFields = ['Msg_Long', 'Msg_Short'];

                //Replace personalization strings for all occurrencies
                for (let i = 0; i < inputFields.length; i++) {
                    decodedArgs[0][inputFields[i]] = decodedArgs[0][inputFields[i]].replace(/\$\{([^}]+)\}/g, 
                        (match, captured) => decodedArgs[1][captured]);
                    
                }

                let logReq = {
                        SubscriberKey: decoded.keyValue,
                        Msg_ID: decodedArgs[0].Msg_ID,
                        JourneyId: decoded.journeyId,
                        ActivityId: decoded.activityId,
                        ActivityObjectID: decoded.activityObjectID,
                        Status: '',
                        Error_Message: ''
                };

                console.log('*** Decode inArguments after replace ***');
                console.log(decodedArgs);

                try{
                    if(decodedArgs[0].Switch == 'on'){
                        //Postbin
                        res = await axios.post(env.API_URL, decodedArgs[0],
                            {
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            }
                        );
                    }else{
                        //WP
                        let TokenWP = await WPgetAccessToken();
                        if(TokenWP != null){
                            res = await WPexecuteInsert(TokenWP, decodedArgs[0]);
                        }else{
                            console.error('The Token doesn\'t exist!');
                            res = { status: 404 };
                        }

                    }
                    
                    if(res.status != '200'){
                        let logPush = await logPushHistory(logReq, null, res.status);
                        console.log('*** Log push History ***');
                        console.log(logPush);
                    }

                    return res.status;

                }catch(e){
                    console.error(e);
                    let logPush = await logPushHistory(logReq, e, null);
                    console.log('*** Log push History ***');
                    console.log(logPush);

                    return e.response.status;
                    
                }
            }else{
                console.error('Argument decoded not found.');
                return 404;
            }

        } else {
            console.error('inArguments invalid.');
            return 400;
        }

    }catch(e){
        console.error(e);
        return 500;
    }

}