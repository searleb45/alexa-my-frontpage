var https = require('https');
var fs = require('fs');

let subredditList = [];
let nextName = '';
const NUM_SLOT_VALUES = 50000,
      REDDIT = 'www.reddit.com',
      POPULAR_REDDIT_URL = '/subreddits/popular.json';

callRedditService();

function callRedditService( nextVal ) {
  if( subredditList.length < NUM_SLOT_VALUES ) {
    httpGet(REDDIT, POPULAR_REDDIT_URL + '?limit=100' + (nextVal ? '&after=' + nextVal : ''));
  } else {
    fs.writeFile('subredditslottype.txt', subredditList.join('\n'), (err) => {
      if( err ) {
        console.log(err);
      } else {
        console.log('done');
      }
    })
  }
}

function httpGet(host, path, callback, accessToken) {
    var options = {
        host: host,
        path: path
    };

    return https.get(options, (request) => {

        var body = '';

        request.on('data', (d) => {
            body += d;
        });

        request.on('end', function () {
            if( body ) {
                let res = JSON.parse(body);
                for( var i=0; i<res.data.children.length; i++) {
                  subredditList.push(res.data.children[i].data.display_name);
                  console.log(res.data.children[i].data.display_name);
                }
                console.log('loaded ' + subredditList.length + ' reddits');
                callRedditService( res.data.after );
            } else {
                console.log('message body is blank');
            }
        });

    });
}