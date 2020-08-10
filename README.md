Install ask-cli and initialize it
```
$ npm install -g ask-cli
```

Install awscli

Configure us-east-1 region (region is hardcoded in scripts and easier when using the Alexa Skill)
```aws configure```

Create Lambda function, DynamoDB table and iam roles
```
$ aws cloudformation deploy --template-file ./infrastructure/music-cloud.json --stack-name music-cloud-stack --capabilities CAPABILITY_IAM

$ aws cloudformation describe-stacks --stack-name music-cloud-stack
```

Create Alexa Skill, as detailed in https://medium.com/voice-tech-podcast/build-your-own-music-streaming-service-with-amazon-alexa-41c7bf1eb66a. Some of the options have changed, make sure to use lowercase just select Custom when asked for Model.

Edit .ask/config.template with your skill ID (provided after creating the Alexa Skill) and Lambda ARN (aws cloudformation describe-stacks) and save as .ask/config

In AWS Lambda, add a Alexa Skills Kit trigger for the MusicCloudLambda function, inputting the skill ID.

Now that the skill ID is known, initialize 'ask':
```ask-cli init```
Input the skill ID, and for Package Path:
./lambda/us-east-1_MusicCloudLambda/

Copy the Lambda’s ARN (from the upper right corner: ARN — arn:aws:lambda:us-east-1:*:function:MusicCloudLambda) and go back to your Alexa Skill -> Build -> Endpoint and paste it into the Default Region field. Save. Build Model to have changes take effect.


To generate the catalog files:

Generate Dropbox token as described here: https://blogs.dropbox.com/developers/2014/05/generate-an-access-token-for-your-own-account/

Edit dropbox-catalog/.env.template with your Dropbox token and save as .env

Make sure your music folder contains _only_ .mp3 files
```
$ cd dropbox-catalog
$ npm install
$ node index.js upload -d ./mp3/
$ node index.js catalog
```

The first command, for each MP3 file from the ./mp3/ directory it will:
- read the ID3 tags — please make sure each file has at least the artist and the title
- upload the file to Dropbox
- create a shareable link
- save the ID3 tags and the shareable link to the cloud-music table

The second command will create two files: artists.json and songs.json. These two files represent the catalogs which will be uploaded to Alexa and make it understand your music collection.

Deploy the skill and lambda
```
$ ask deploy
```
