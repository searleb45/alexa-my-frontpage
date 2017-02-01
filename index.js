'use strict';
var Alexa = require('alexa-sdk'),
    doc = require('aws-sdk'),
    http = require('https');


var APP_ID = 'amzn1.ask.skill.b800d47a-3bb7-4a59-8e7a-f6b6fae05798',
    VERSION = '0.0.2',
    alexa;

var dynamo = new doc.DynamoDB();

const languageStrings = {
    'LINK_ACCOUNT': 'You need to link your Reddit account to use this skill. See the Alexa app for more information',
    'POSTS_FOUND_HOMEPAGE': 'Here are the top posts from your Reddit front page: ',
    'POSTS_FOUND_SUBREDDIT': 'Here are the top posts from are ',
    'FROM_WHERE': 'From r ',
    'CHECK_APP': 'You can see more information about these posts in the Alexa app.',
    'CARD_TITLE': 'My Frontpage',
    'SUBREDDIT_PREFIX': '/r/'
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
            fetchSubredditList( userId, accessToken );
        } else {
            console.log('fetching from dynamodb');
            getUserSavedList( userId );
        }
    },
    'getSubredditIntent': function() {
        var subredditName = this.event.request.intent.slogs.subreddit.value.split(' ');
        subredditName = subredditName[Math.max(subredditName.length - 1, 0)];
        subredditList.push(subredditName);
        getSubredditsFromList( readPostsFromOne );
    },
    'Unhandled': function() {
        this.emit('getFrontpageIntent');
    }
}

function getSubredditsFromList( callback ) {
    if( subredditList ) {
        var redditPath = '/r/' + subredditList.join('+') + '.json';
        httpGet('www.reddit.com', redditPath, (res) => {
            callback( res.data.children.slice(0,5));
        });
    } else {
        this.emit(':tellWithLinkAccountCard', languageStrings.LINK_ACCOUNT);
    }
}

function readPostsFromOne( toRead ) {
    var response = languageStrings.POSTS_FOUND_SUBREDDIT + subredditList[0];
    for( let i=0; i<5; i++) {
        let postObj = toRead[i];
        console.log(postObj);
        response += postObj.data.title + (postObj.data.title.substr(postObj.data.title.length - 1).match('[.?!]') ? ' ' : '. ');
    }
    response += languageStrings.CHECK_APP;
    alexa.emit(':tellWithCard', response, languageStrings.SUBREDDIT_PREFIX + subredditList[0], response);
}

function readPostsFromMultiple( toRead ) {
    var response = languageStrings.POSTS_FOUND_HOMEPAGE;
    var cardContent = '';
    for( let i=0; i<5; i++ ) {
        let postObj = toRead[i];
        console.log(postObj);
        response += languageStrings.FROM_WHERE + postObj.data.subreddit + ': ';
        response += postObj.data.title + (postObj.data.title.substr(postObj.data.title.length - 1).match('[.?!]') ? ' ' : '. ');
        cardContent += postObj.data.title + ' - ' + languageStrings.SUBREDDIT_PREFIX + postObj.data.subreddit + '\n';
    }
    response += languageStrings.CHECK_APP;
    alexa.emit(':tellWithCard', response, languageStrings.CARD_TITLE, cardContent);
}

exports.handler = function(event, context, callback) {
    alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    
    alexa.registerHandlers(handlers);
    alexa.execute();
};

function fetchSubredditList( userId, accessToken ) {
    httpGet('oauth.reddit.com', '/subreddits/mine/subscriber', (res) => {

    }, accessToken);
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
        getSubredditsFromList( readPostsFromMultiple );
    });
}

// alexa = {
//     emit: function(eventType, response) {
//         console.log(response);
//     }
// }
// subredditList = ['AskReddit', 'technology'];
// getSubredditsFromList();

function httpGet(host, path, callback, accessToken) {
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