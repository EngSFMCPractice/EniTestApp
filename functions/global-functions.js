const jwt = require('jsonwebtoken');
const axios = require('axios');
const db = require('../db-config');

const env = process.env;

exports.JWTdecode = async (body, secret) => {
    if (!body) {
        throw new Error('invalid jwtdata');
    }

    try {
        const decodedToken = jwt.verify(body.toString('utf8'), secret, {
            algorithm: 'HS256'
        });
        return decodedToken;
    } catch (error) {
        throw error;
    }
};

exports.getTokenSFMC = async () =>{
    try{
        let res = await axios.post(env.SFMC_ROOT_AUTH + 'v2/token', {
            grant_type: "client_credentials",
            client_id: env.SFMC_CLIENT_ID,
            client_secret: env.SFMC_CLIENT_SECRET,
            account_id: env.SFMC_ACCOUNT_ID
        });

        return res.status == 200 && res.data.access_token ? {token: res.data.access_token, expire: res.data.expires_in} : null;

    } catch(e){
        console.error(e);
        return null;
    }

}

exports.getTokenSFMCBuChild = async () =>{
    try{
        let res = await axios.post(env.SFMC_ROOT_AUTH_BUCHILD + 'v2/token', {
            grant_type: "client_credentials",
            client_id: env.SFMC_CLIENT_ID_BUCHILD,
            client_secret: env.SFMC_CLIENT_SECRET_BUCHILD,
            account_id: env.SFMC_ACCOUNT_ID_BUCHILD
        });

        return res.status == 200 && res.data.access_token ? {token: res.data.access_token, expire: res.data.expires_in} : null;

    } catch(e){
        console.error(e);
        return null;
    }

}

exports.getPushSFMC = async (req) =>{
    if(req.token){
        try{
            let res = await axios.get(env.SFMC_ROOT_REST + "asset/v1/content/assets?$filter=assetType.id%20eq%20'230'", {
                headers: {
                    'Authorization': 'Bearer ' + req.token
                }
            });

            let jsonPayload = res.data;
            if (jsonPayload.hasOwnProperty('items') && jsonPayload.items.length > 0) {
                const itemsArray = jsonPayload.items;
                const filteredItems = [];
    
                itemsArray.forEach(item => {
    
                    const filteredItem = {
                        id: item.id,
                        name: item.name,
                        customerKey: item.customerKey,
                        objectID: item.objectID
                    };
                
                    filteredItems.push(filteredItem);
                });

                return filteredItems;
                
                } else {
                    return {};
                }
    
        } catch(e){
            console.error(e);
            return {};
        }
    }else{
        return {};
    }

}

/*
exports.refreshTokenSFMC = async (tokenObject, JourneyID) => {
    try{

        let fuelToken = tokenObject.fuel2token;
        const fuelExpire = moment.unix(tokenObject.expires / 1000).tz('Europe/Rome');
        const now = moment().tz('Europe/Rome');

        let checkToken = await db.getTokenByJourneyID(JourneyID);
        if(checkToken.length > 0){
            //In the DB have been found a token with the given JourneyID
            let TokenExpire = moment.unix(checkToken[0].Expire / 1000).tz('Europe/Rome');
            if(TokenExpire.isBefore(now)){
                //Token found expired

                let generateNewAccess = await exports.getTokenSFMC();
                if(generateNewAccess != null){
                    let newAccessExpire = now.clone().add(generateNewAccess.expire, 'seconds');
                    let dbUpdate = await db.updateToken({JourneyID: JourneyID, Token: generateNewAccess.token, Expire: newAccessExpire.valueOf()});

                    if(dbUpdate > 0){
                        console.log('Token aggiornato correttamente. (Token found expired)');
                        return {Token: generateNewAccess.token};
                    }else{
                        console.log('Il Token ha avuto un problema durante l\'aggiornamento (Token found expired)');
                        return {Error: 500, Details: 'Il Token ha avuto un problema durante l\'inserimento'};
                    }      
                    
                }else{
                    console.log('Errore nella generazione di un nuovo token! (Update)');
                    return {Error: 500, Details: 'Errore nella generazione di un nuovo token'};
                }

            }else{
                //Token found not expired
                console.log('Token found in the DB is not expired: '+ checkToken[0].Token);
                return {Token: checkToken[0].Token};
            }
        }else{
            //In the DB haven't been found a token with the given JourneyID
            if(fuelExpire.isBefore(now)){
                //If fuel token is expired
                let generateNewAccess = await exports.getTokenSFMC();
                if(generateNewAccess != null){
                    let newAccessExpire = now.clone().add(generateNewAccess.expire, 'seconds');
                    let dbInsert = await db.insertToken([JourneyID, generateNewAccess.token, newAccessExpire.valueOf()]);

                    if(dbInsert > 0){
                        console.log('Token inserito correttamente. (If fuel token is expired)');
                        return {Token: generateNewAccess.token};
                    }else{
                        console.log('Il Token ha avuto un problema durante l\'inserimento (If fuel token is expired)');
                        return {Error: 500, Details: 'Il Token ha avuto un problema durante l\'inserimento.'};
                    }      
                    
                }else{
                    console.log('Errore nella generazione di un nuovo token! (Insert)');
                    return {Error: 500, Details: 'Errore nella generazione di un nuovo token.'};
                }
            }else{
                //If fuel token is not expired
                let dbInsert = await db.insertToken([JourneyID, fuelToken, fuelExpire.valueOf()]);
                if(dbInsert > 0){
                    console.log('Token inserito correttamente. (If fuel token is not expired)');
                    return {Token: fuelToken};
                }else{
                    console.log('Il Token ha avuto un problema durante l\'inserimento (If fuel token is not expired)');
                    return {Error: 500, Details: 'Il Token ha avuto un problema durante l\'inserimento'};
                }
            }
        }

    }catch(e){
        console.error('Errore durante la richiesta:', e);
        return {Error: 500, Details: 'Errore durante la richiesta.'};
    }

}
*/

exports.logPushHistory = async (req, error, status) => {

    if(Object.values(req).length > 0){

        if(error != null){
            req.Status = error.response.status ? error.response.status : '';
            req.Error_Message = error.message ? error.message : '';
        }
        if(status != null){
            req.Status = status;
        }

        try{
           let dbInsert = await db.insertLogHistory(req);

           if (dbInsert > 0){
                return 200;
           }else{
                console.error('Errore durante l\'inserimento nel database.');
                return 500;
           }

        } catch (e) {
            console.error('Errore durante la richiesta:', e);
            return 500;
        }

    }else{
        console.error('Request body empty.');
        return 404;
    }
}