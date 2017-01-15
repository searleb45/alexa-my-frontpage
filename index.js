'use strict';
var Alexa = require('alexa-sdk');
var APP_ID = 'amzn1.ask.skill.b800d47a-3bb7-4a59-8e7a-f6b6fae05798';

var ENDPOINTS = {
    subreddits: '/subreddits/mine/subscriber'
}

var handlers = {
    'LaunchRequest': function() {
        this.emit('getFrontpageIntent');
    },
    'getFrontpageIntent': function() {
        this.emit(':tell', 'Get Front Page Intent called successfully.');
    }
}

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    
    alexa.registerHandlers(handlers);
    alexa.execute();
};


function apiEndpoint(key) {
    return;
}

function httpGet(path, callback) {

}