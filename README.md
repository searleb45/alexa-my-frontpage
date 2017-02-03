# My Frontpage
Alexa skill to read posts from your Reddit front page or a particular subreddit.  Uses the Reddit API to access a user's saved subreddits through OAuth, Amazon DynamoDB to persist a user's subscriptions, and AWS Lambda to retrieve posts and service requests.

NOTE: Due to integration issues between Amazon and Reddit's OAuth servers, the access code retrieved from Reddit is only good for one hour. The subreddit list for a given user is saved to Amazon's DynamoDB as a workaround. If the user's subscriptions change, the Reddit account will need to be re-linked in the Alexa app to update My Frontpage's saved list.

## Setup Instructions
1. Pull the latest code from this repo. Run `npm install` to install the required node modules.
  1. Create a zip file containing index.js and the node_modules folder. The provided `bundle.sh` file will automate this process for users running on Mac or Linux. Windows users will need to zip the files in Windows Explorer.
2. Create a new DynamoDB table to map Amazon user IDs to subscriber lists. (https://console.aws.amazon.com/dynamodb/home?region=us-east-1#)
  1. Click on Create Table.
  2. Give the table a name of your choice with a primary key of type `string` with the name `userId`.
3. Create a Lambda function to handle Alexa requests and interact with Reddit/DynamoDB. (https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions?display=list)
  1. Create a new Lambda function with the "Blank" blueprint. Choose Alexa Skills Kit as a trigger.
  2. Give your lambda function a name and description. Under Code entry type, choose to upload a .zip file and upload the file created in step 1.
  3. Create an environment variable named `DYNAMO_TABLE` with the same value as the DynamoDB table created in step 2.
  4. Create another environment variable named `USER_AGENT`  with the value that should be passed to Reddit as the application's user agent. Reddit's API documentation recommends the format `platform:app_id:version (by /u/reddit_username)`.
  4. Give your Lambda function an execution role with full access to DynamoDB as well as basic Lambda execution.
  5. Keep this function open - you will need to modify a few things later in the process.
4. Create a new Alexa skill in the Amazon Developer Console. (https://developer.amazon.com/home.html)
  1. Under Skill Information, choose a skill name and invocation name.
  2. Under Interaction Model, copy the intentschema.json and sampleutterances.txt into the corresponding text boxes. You will also need to set up a custom slot type called "subreddit" to allow Alexa to handle requests to read from a particular subreddit.
  
      The provided subredditslottype.txt contains a list of the top 50,000 subreddits by subscriber count as of January 2017. Feel free to copy as many of these as you wish (a larger number will make interaction model building slower and less likely to complete successfully). You may also use the included fetchTopReddits.js to update the subreddit list by running `node fetchTopReddits.js`.
  3. Under Configuration, choose an AWS Lambda ARN and copy the value shown in the top right of your previously created Lambda function page. 
  4. Choose "Yes" for Account Linking. Copy the redirect URLs listed in the panel that opens as they will be used in the next step. If your app is hosted in the US-East region, choose the URL from pitangui.amazon.com. If hosting in Europe, choose the layla.amazon.com URL.
  
4. Create a Reddit app to allow for account access. (https://www.reddit.com/prefs/apps)
  1. Near the bottom of the page, click on "Create app".
  2. Give your app a unique name. Choose "installed app" for the application type.
  3. Enter the copied URL from Amazon into the redirect uri input field. Finish creating your app.
5. Complete account linking
  1. Return to your Alexa skill page. Fill in the account linking fields as follows:
  
  Authorization URL: https://www.reddit.com/api/v1/authorize.compact
  
  Client Id: 14-character string listed under your application name on https://reddit.com/prefs/apps
  
  Domain list: reddit.com, redditstatic.com, redditmedia.com
  
  Scope: identity, mysubreddits
  
  Authorization grant type: implicit grant
  
6. Add APP_ID environment variable to the lambda function
  1. Copy the application ID from the Skill Information tab of your Alexa skill page.
  2. Return to your Lambda function page and create a new environment variable named `APP_ID` set to the application ID.
  
  
  At this point, the application should be completely configured. Link your Reddit account in the Alexa app and request to get your front page. Alexa should read out the top 5 posts across all subscribed subreddits for the linked account.
