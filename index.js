'use strict';
var Alexa = require('alexa-sdk'),
    http = require('http');


var APP_ID = 'amzn1.ask.skill.b800d47a-3bb7-4a59-8e7a-f6b6fae05798',
    VERSION = '0.0.1';


var alexa;

const API_ENDPOINT_ROOT = 'oauth.reddit.com/';

const languageStrings = {
    'LINK_ACCOUNT': 'You need to link your Reddit account to use this skill. See the Alexa app for more information',
    'POSTS_FOUND_HOMEPAGE': 'Here are the top posts from your Reddit front page: ',
    'FROM_WHERE': 'From ',
    'CHECK_APP': 'You can see more information about these posts in the Alexa app.'
}

var handlers = {
    'LaunchRequest': function() {
        this.emit('getFrontpageIntent');
    },
    'getFrontpageIntent': function() {
        console.log(this.event);
        var accessToken = this.event.session.user.accessToken;
        if( accessToken ) {
            httpGet( apiEndpoint(''), accessToken, (res) => {
                var response = languageStrings.POSTS_FOUND_HOMEPAGE;
                var toRead = res.data.children.slice(0,5);
                for( let i=0; i<5; i++ ) {
                    let postObj = toRead[i];
                    response += languageStrings.FROM_WHERE + postObj.subreddit + ': ';
                    response += postObj.title + '. ';
                }
                response += languageStrings.CHECK_APP;
                alexa.emit(':tell', response);
            });
        } else {
            this.emit(':tellWithLinkAccountCard', languageStrings.LINK_ACCOUNT);
        }
    }
}

exports.handler = function(event, context, callback) {
    alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    
    alexa.registerHandlers(handlers);
    alexa.execute();
};

// Build an API URL from the root, endpoint route, and JSON response type
function apiEndpoint(key) {
    return '/' + key + '.json';
}

function httpGet(path, accessToken, callback) {

    var options = {
        host: API_ENDPOINT_ROOT,
        path: path,
        headers: {
            'Authorization': 'bearer ' + accessToken,
            'User-Agent': 'Alexa:' + APP_ID + ':' + VERSION
        }
    }

    return http.get(options, (request) => {

        var body = '';

        request.on('data', (d) => {
            body += d;
        });

        request.on('end', function () {
            callback( JSON.parse(body) );
        });

    });
}