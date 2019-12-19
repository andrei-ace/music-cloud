require('dotenv').config();
const crypto = require('crypto');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const recursive = require('recursive-readdir');
const { promisify } = require('util');
const fetch = require('node-fetch');
const Promise = require('bluebird');
fetch.Promise = Promise;

const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient();
const putAsync = promisify(docClient.put).bind(docClient);
const scanAsync = promisify(docClient.scan).bind(docClient);

const mm = require('music-metadata');
const Dropbox = require('dropbox').Dropbox;

const argv = require('yargs')
    .demandCommand()
    .command('upload', 'Uploads the specified directory to dropbox', (yargs) => {
        yargs.alias('d', 'dir')
            .nargs('d', 1)
            .describe('d', 'Directory')
            .example('$0 upload -d ./mp3/', 'uploads the specified directory to dropbox')
            .demandOption(['d'])
    })
    .command('catalog', 'Creates the catalog')
    .alias('h', 'help')
    .argv

const dbx = new Dropbox({ fetch: require('node-fetch'), accessToken: process.env.DROPBOX_API_TOKEN });

const readMetadata = async (filePath) => {
    const metadata = await mm.parseFile(filePath, { native: false });
    return { metadata, filePath };
}

const scanDirectory = async (dir) => {
    return await promisify(recursive)(dir);
}

const uploadToDropbox = async (entry) => {
    const content = await promisify(fs.readFile)(entry.filePath);
    const dropboxMetadata = await dbx.filesUpload({
        path: '/mp3/' + path.basename(entry.filePath),
        contents: content,
        mode: {
            '.tag': 'overwrite'
        }
    });
    console.log('Uploaded:', entry.filePath);
    return { dropboxMetadata, ...entry };
}

const shareFromDropbox = async (entry) => {
    const sharingPathLinkMetadata = await dbx.sharingCreateSharedLink({
        path: entry.dropboxMetadata.path_lower,
        short_url: false
    });
    entry.dropboxMetadata.url = sharingPathLinkMetadata.url.replace('https://www.dropbox.com/', 'https://dl.dropboxusercontent.com/');
    entry.id = hash(entry.dropboxMetadata.id);
    entry.artist_id = hash(entry.metadata.common.artist);
    return entry;
}

const hash = (value) => {
    return crypto.createHash('sha1').update(value).digest('base64');
}

const persistToDynamoDB = async (entry) => {
    let item = _.pick(entry, ['id',
        'artist_id',
        'metadata.common.title',
        'metadata.common.artist',
        'metadata.common.album',
        "dropboxMetadata.server_modified",
        "dropboxMetadata.url",
        "dropboxMetadata.id"]);
    await putAsync({
        TableName: 'cloud-music', Item: item
    });
    return entry;
}

const scanDynamoDb = async () => {
    const tableScanResult = await scanAsync({
        TableName: 'cloud-music'
    });
    return tableScanResult.Items;
}

const mapToArtistCatalog = (id, name) => {
    return {
        "id": id,
        "names": [
            {
                "language": "en",
                "value": name
            }
        ],
        "popularity": {
            "default": 100
        },
        "lastUpdatedTime": new Date().toISOString(),
        "deleted": false
    };
}

const createArtistCatalog = (dbItems) => {
    const catalog = {
        "type": "AMAZON.MusicGroup",
        "version": 2.0,
        "locales": [
            {
                "country": "US",
                "language": "en"
            }
        ],
        "entities": []
    };

    let artists = {};

    dbItems.forEach(item => {
        artists[item.artist_id] = item.metadata.common.artist;
    });

    catalog.entities = _.toPairs(artists).map(([id, name]) => mapToArtistCatalog(id, name));

    return catalog;
}

const createSongCatalog = async (dbItems) => {
    const catalog = {
        "type": "AMAZON.MusicRecording",
        "version": 2.0,
        "locales": [
            {
                "country": "US",
                "language": "en"
            }
        ],
        "entities": []
    };

    catalog.entities = await Promise.map(dbItems, item => mapToSongsCatalog(item), { concurrency: 5 });

    return catalog;
}

const mapToSongsCatalog = async (entry) => {

    let deleted = await fetch(entry.dropboxMetadata.url, { method: 'HEAD' }).then((res) => !res.ok);

    return {
        "id": entry.id,
        "names": [
            {
                "language": "en",
                "value": entry.metadata.common.title
            }
        ],
        "popularity": {
            "default": 100
        },
        //"lastUpdatedTime": deleted ? new Date().toISOString() : entry.dropboxMetadata.server_modified,
        "lastUpdatedTime": new Date().toISOString(),
        "artists": entry.artist_id ? [
            {
                "id": entry.artist_id,
                "names": [
                    {
                        "language": "en",
                        "value": entry.metadata.common.artist
                    }
                ]
            }
        ] : [],
        "albums": entry.metadata.common.album ? [
            {
                "id": entry.metadata.common.album,
                "names": [
                    {
                        "language": "en",
                        "value": entry.metadata.common.album
                    }
                ],
                "releaseType": "Studio Album"
            }
        ] : [],
        "deleted": deleted
    }
}

if (argv._[0] === 'upload') {
    scanDirectory(argv.dir)
        .then(files => Promise.map(files, file => readMetadata(file)))
        .then(entries => Promise.map(entries, entry => uploadToDropbox(entry), { concurrency: 5 }))
        .then(entries => Promise.map(entries, entry => shareFromDropbox(entry), { concurrency: 5 }))
        .then(entries => Promise.map(entries, entry => persistToDynamoDB(entry), { concurrency: 5 }))
        .then(entries => console.log(`Uploaded ${entries.length} files`))
        .catch(error => console.error(error));
}

if (argv._[0] === 'catalog') {

    (async () => {
        let dbItems = await scanDynamoDb();
        let catalog = await createSongCatalog(dbItems);
        fs.writeFileSync('songs.json', JSON.stringify(catalog, null, 2));
        let artistCatalog = createArtistCatalog(dbItems);
        fs.writeFileSync('artists.json', JSON.stringify(artistCatalog, null, 2));
    })();
}
