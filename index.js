'use strict';
var Alexa = require('alexa-sdk'),
    doc = require('aws-sdk'),
    http = require('http');


var APP_ID = 'amzn1.ask.skill.b800d47a-3bb7-4a59-8e7a-f6b6fae05798',
    VERSION = '0.0.2',
    alexa;

var dynamo = new doc.DynamoDB();

const languageStrings = {
    'LINK_ACCOUNT': 'You need to link your Reddit account to use this skill. See the Alexa app for more information',
    'POSTS_FOUND_HOMEPAGE': 'Here are the top posts from your Reddit front page: ',
    'FROM_WHERE': 'From ',
    'CHECK_APP': 'You can see more information about these posts in the Alexa app.'
}
const tableName = 'myFrontpageSubredditCache';

// Return empty list by default in case of error
var subredditList = [];

var handlers = {
    'LaunchRequest': function() {
        this.emit('getFrontpageIntent');
    },
    'getFrontpageIntent': function() {
        console.log('intent found');
        var accessToken = this.event.session.user.accessToken,
            userId = this.event.session.user.userId;
        if( accessToken ) {
            console.log('fetching from reddit');
            subredditList = fetchSubredditList( userId, accessToken );
        } else {
            console.log('fetching from dynamodb');
            subredditList = getUserSavedList( userId );
        }
    },
    'Unhandled': function() {
        this.emit('getFrontpageIntent');
    }
}

function getSubredditsFromList() {
    console.log('calling getSubredditsFromList');
    if( subredditList ) {
        var redditPath = '/r/' + subredditList.join('+') + '.json';
        console.log('path is ' + redditPath);
        httpGet('www.reddit.com', redditPath, (res) => {
            console.log(res);
            var response = languageStrings.POSTS_FOUND_HOMEPAGE;
            var toRead = JSON.parse(res).data.children.slice(0,5);
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

exports.handler = function(event, context, callback) {
    alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    
    alexa.registerHandlers(handlers);
    alexa.execute();
};

function fetchSubredditList( userId, accessToken ) {
    httpGet('oauth.reddit.com', '/subreddits/mine/subscriber', (res) => {

    });
}

function getUserSavedList( userId ) {
    console.log('fetching from dynamodb for userId' + userId);
    dynamo.getItem( {
        TableName: 'myFrontpageSubredditCache', 
        Key: {
            userId: {
                S: userId
            }
        }
    }, (err, res) => {
        if( err ) {
            console.log(err);
        } else {
            console.log('subreddit list found');
            console.log(res.Item.subreddits.SS);
            if( res && res.Item && res.Item.subreddits ) {
                subredditList = res.Item.subreddits.SS;
            }
        }
        getSubredditsFromList();
    });
}

subredditList = ['AskReddit', 'technology'];
getSubredditsFromList();

function httpGet(host, path, callback) {
    var options = {
        host: host,
        path: path
    };

    return http.get(options, (request) => {
        console.log(request.statusCode);

        var body = '';

        request.on('data', (d) => {
            body += d;
        });

        request.on('end', function () {
            console.log('response body');
            console.log(body);
            if( body ) {
                callback( JSON.parse(body) );
            } else {
                console.log('message body is blank');
            }
        });

    });
}