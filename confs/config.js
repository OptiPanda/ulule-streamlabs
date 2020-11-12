var config = {
    ulule: {
        username:'', // your username
        key:'' // check http://www.ulule.com/settings/privacy/
        
    },
    streamlabs: {
        clientId:'',
        clientSecret:'',
        redirectUri:'http://localhost:8080/auth', // url used to redirect when authenticating
        apiBase: 'https://www.streamlabs.com/api/v1.0'
    },
    general: {
        port: 8080
    }
};

module.exports = config;