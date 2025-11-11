const axios = require('axios');
const env = process.env;

exports.WPgetAccessToken = async () =>{
    try{
        let res = await axios.post(env.WProotApi + 'wp-json/api/v1/token', {
            username: env.WordpressUser,
            password: env.WordpressPsw
        });

        return res.status == 200 && res.data.jwt_token ? res.data.jwt_token : null;

    } catch(e){
        if(e.isAxiosError){
            console.error('Error ' + e.code + ': ' + e.reason);
        }else{
            console.error(e);
        }
        
        return null;
    }

}

exports.WPvalidateJWT = async (Token) => {
    const validateUrl = env.WProotApi + 'wp-json/api/v1/token-validate';

    try{
        let res = await axios.get(validateUrl, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Token}`
            }
        });

        return res.data.code;

    } catch(e){
        console.error(e);
        return null;
    }
}

exports.WPexecuteInsert = async (Token, req) => {
    let res;
    if(Token != null){
        if(await exports.WPvalidateJWT(Token) == 200){
            delete req.Switch;
            try{
                res = await axios.post(env.WProotApi + 'wp-json/wp/v2/push_history', req,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${Token}`
                        }
                    }
                );
                return {status: res.status};

            } catch(e){
                console.error(e);
                return {status: 500};
            }

        }else{
            console.error('The given token is not valid!');
            return {status: 401};
        }
    }else{
        console.error('The Token doesn\'t exist!');
        return {status: 404};
    }
}