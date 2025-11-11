const axios = require('axios');
const {getLogHistory} = require('../db-config');
const {getTokenSFMC} = require('../functions/global-functions');

const env = process.env;

const cronJobSFMC = async () => {
    let SFMC = await getTokenSFMC();

    if(SFMC != null){
        let getPostgresData = {};
        getPostgresData['items'] = await getLogHistory();

        if(getPostgresData['items'].length > 0){
            try{
                let res = await axios.post(env.SFMC_ROOT_REST + 'data/v1/async/dataextensions/key:' + env.SFMC_EXT_KEY + '/rows', getPostgresData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SFMC.token}`
                    }
                });
                
                return res.status;

            }catch (e) {
                console.error('Error: ' + e);
                return 0;
            }
        }else{
            return 0;
        }
    }else{
        return 0;
    }
}

cronJobSFMC();

