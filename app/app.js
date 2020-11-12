require('dotenv').config()

var express = require('express');
var bodyParser = require('body-parser');
var config = require('../confs/config');

const app = express()
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./datas/db.sqlite')
const axios = require('axios')

if (config.ulule.key === '' || config.ulule.username === ''  || config.streamlabs.clientId === ''  || config.streamlabs.clientSecret === '' ) {
    console.log('OOPS :-(');
    console.log('Please configure your keys etc... in app/config.js');
    return;
}

var request = require('request');

app.use(bodyParser.json());

app.get('/', (req, res) => {
    db.serialize(() => {
        db.run("CREATE TABLE IF NOT EXISTS `streamlabs_auth` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `access_token` CHAR(50), `refresh_token` CHAR(50))")
    
        db.get("SELECT * FROM `streamlabs_auth`", (err, row) => {
            if (row) {
                axios.get(`${config.streamlabs.apiBase}/donations?access_token=${row.access_token}`).then((response) => {
                    res.send(`<pre>${JSON.stringify(response.data.data, undefined, 4)}</pre>`)
                })
            } else {
                let authorize_url = `${config.streamlabs.apiBase}/authorize?`
    
                let params = {
                    'client_id': config.streamlabs.clientId,
                    'redirect_uri': config.streamlabs.redirectUri,
                    'response_type': 'code',
                    'scope': 'donations.read+donations.create',
                }
    
                // not encoding params
                authorize_url += Object.keys(params).map(k => `${k}=${params[k]}`).join('&')
    
                res.send(`<a href="${authorize_url}">Authorize with Streamlabs!</a>`)
            }
        })
    })
})

app.get('/auth', (req, res) => {
    let code = req.query.code

    axios.post(`${config.streamlabs.apiBase}/token?`, {
        'grant_type': 'authorization_code',
        'client_id': config.streamlabs.clientId,
        'client_secret': config.streamlabs.clientSecret,
        'redirect_uri': config.streamlabs.redirectUri,
        'code': code
    }).then((response) => {
        db.run("INSERT INTO `streamlabs_auth` (access_token, refresh_token) VALUES (?,?)", [response.data.access_token, response.data.refresh_token], () => {
        res.redirect('/')
        })
    }).catch((error) => {
        console.log(error)
    })
})

app.post('/webhook', function(req, res) {

    if (req.body.resource && req.body.resource.uri) {

        var order_uri = req.body.resource.uri;

        var ulule_auth = config.ulule.username + ':' + config.ulule.key;

        request.get(order_uri, {
            headers: {
                'Authorization': 'ApiKey ' + ulule_auth
            }
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var order = JSON.parse(body);

                var message = order.order_total + '€ de ' + order.user.name +  ' (' + order.user.email + ') par ' + order.payment_method

                console.log(message);

                // trigger Streamlabs POST

            } else {
                console.log('ERROR', error, body);
                res.status(400).json({ error: body });
            }
        });
    } else {
        res.status(400).json({});
    }
});

app.listen(config.general.port, () => console.log(`Demo app listening on port ${config.general.port}!`));

module.exports = app;


