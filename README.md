Install ask-cli and initialize it
```
npm install -g ask-cli
ask-cli init
```

Install awscli
Configure us-east-1 region
Create Lambda function, DynamoDB table and iam roles
```
$ aws cloudformation deploy --template-file ./infrastructure/music-cloud.json --stack-name music-cloud-stack --capabilities CAPABILITY_IAM

$ aws cloudformation describe-stacks --stack-name music-cloud-stack
```

Edit .ask/config.template with your skill id and Lambda ARN (aws cloudformation describe-stacks)

Add Alexa Skills Kit trigger for the MusicCloudLambda 

To generate the catalog files:

Install and configure awscli
Create user, roles and DynamoDB table, Drobpbox token as described here: https://medium.com/@andreiciobanu_15529/build-your-own-music-streaming-service-with-amazon-alexa-41c7bf1eb66a

Edit .env.template with your Dropbox token and rename to .env
```
$ cd dropbox-catalog
$ npm install
$ node index.js upload -d ./mp3/
$ node index.js catalog
```

Upload catalog files as described in the medium article

Deploy the skill and lambda
```
$ ask deploy
```
