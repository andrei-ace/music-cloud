Install ask-cli and initialize it
```
$ npm install -g ask-cli@2
$ ask init
```

Install awscli

Configure us-east-1 region

Create Lambda function, DynamoDB table and iam roles
```
$ aws cloudformation deploy --template-file ./infrastructure/music-cloud.json --stack-name music-cloud-stack --capabilities CAPABILITY_IAM

$ aws cloudformation describe-stacks --stack-name music-cloud-stack
```

Edit .ask/config.template with your skill id and Lambda ARN (aws cloudformation describe-stacks) and rename to config

Add Alexa Skills Kit trigger for the MusicCloudLambda 

To generate the catalog files:

Install and configure awscli

Create Dropbox token as described here: https://medium.com/@andreiciobanu_15529/build-your-own-music-streaming-service-with-amazon-alexa-41c7bf1eb66a

Edit .env.template with your Dropbox token and rename to .env
```
$ cd dropbox-catalog
$ npm install
$ node index.js upload -d ./mp3/
$ node index.js catalog
```

Upload catalog files as described in the medium article. Note the following commands have changed when using version ask-cli@2:
**Step 7**
```
# create the artist catalog
$ ask smapi create-catalog --type AMAZON.MusicGroup --title catalog-artists --usage AlexaMusic.Catalog.MusicGroup
# associate catalog to skill
$ ask smapi associate-catalog-with-skill -s YOUR-SKILL-ID-HERE -c YOUR-ARTISTS-CATALOG-ID-HERE
# upload artist catalog
$ ask smapi upload-catalog -c YOUR-ARTISTS-CATALOG-ID-HERE -f ./dropbox-catalog/artists.json
# now do the same for the song catalog
$ ask smapi create-catalog --type AMAZON.MusicRecording --title catalog-songs --usage AlexaMusic.Catalog.MusicRecording
$ ask smapi associate-catalog-with-skill -s YOUR-SKILL-ID-HERE -c YOUR-SONG-CATALOG-ID-HERE
$ ask smapi upload-catalog -c YOUR-SONG-CATALOG-ID-HERE -f ./dropbox-catalog/songs.json
```
**Step 8**
To check the status of a catalog upload you use this command
```
$ ask smapi get-content-upload-by-id -c YOUR-CATALOG-ID-HERE --upload-id YOUR-UPLOAD-ID-HERE
```

Deploy the skill and lambda
```
$ ask deploy
```
