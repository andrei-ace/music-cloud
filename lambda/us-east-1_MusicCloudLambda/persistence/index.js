const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient();
const { promisify } = require('util');

const scanAsync = promisify(docClient.scan).bind(docClient);
const queryAsync = promisify(docClient.query).bind(docClient);
const getAsync = promisify(docClient.get).bind(docClient);

const { hash } = require('../utils/');

module.exports = {
    findByTrackId: async (trackId) => {
        let response = null;

        let item = await getAsync({
            TableName: 'cloud-music',
            Key: {
                id: trackId
            }
        });

        return item.Item;
    },
    find: async (trackId, artistId) => {
        let item = null;

        if (trackId) {
            item = await getAsync({
                TableName: 'cloud-music',
                Key: {
                    id: trackId
                }
            });
            item = item.Item;
        } else if (artistId) {
            for (i = 0; i < 5; i++) {
                let lastKeyEvaluated = hash(new Date().toISOString());
                let Items = await queryAsync({
                    TableName: 'cloud-music',
                    IndexName: 'artist_id-id-index',
                    KeyConditionExpression: "artist_id=:artist_id and id > :last_id",
                    ExpressionAttributeValues: {
                        ':artist_id': artistId,
                        ':last_id': lastKeyEvaluated
                    },
                    Limit: 1
                });
                item = Items.Items[0];
                if (item)
                    break;
            }
            if (!item) {
                let Items = await queryAsync({
                    TableName: 'cloud-music',
                    IndexName: 'artist_id-id-index',
                    KeyConditionExpression: "artist_id=:artist_id",
                    ExpressionAttributeValues: {
                        ':artist_id': artistId
                    },
                    Limit: 1
                });
                item = Items.Items[0];
            }
        } else {
            for (i = 0; i < 5; i++) {
                let lastKeyEvaluated = hash(new Date().toISOString());
                let Items = await scanAsync({
                    TableName: 'cloud-music',
                    ExclusiveStartKey: {
                        id: lastKeyEvaluated
                    },
                    Limit: 1
                });
                item = Items.Items[0];
                if (item)
                    break;
            }
            if (!item) {
                let Items = await scanAsync({
                    TableName: 'cloud-music',
                    Limit: 1
                });
                item = Items.Items[0];
            }
        }
        return item;
    }
}