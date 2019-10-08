const {
    buildNotFound,
    buildGetPlayableContentResponse,
    buildInitiateResponse,
    buildInternalError,
    buildGetPreviousItem,
    buildGetNextItem
} = require('./builders/');

const { find, findByTrackId } = require('./persistence/')

exports.handler = async (event) => {

    console.log(JSON.stringify(event));

    switch (event.header.name) {
        case 'GetPlayableContent':
            return handleGetPlayableContent(event);
        case 'Initiate':
            return handleInitiate(event);
        case 'GetNextItem':
            return handleGetNextItem(event);
        case 'GetPreviousItem':
            return buildGetPreviousItem(event);
    }

    return buildInternalError(event);
};


const handleGetPlayableContent = async (event) => {
    const attributes = event.payload.selectionCriteria.attributes;
    const trackQuery = attributes.find(({ type }) => {
        return type === 'TRACK';
    });
    const artistQuery = attributes.find(({ type }) => {
        return type === 'ARTIST';
    });

    let item = null;
    if (trackQuery) {
        item = await find(trackQuery.entityId, null);
    } else if (artistQuery) {
        item = await find(null, artistQuery.entityId);
    } else {
        item = await find(null, null);
    }

    if (item) {
        return buildGetPlayableContentResponse(event, item);
    } else {
        return buildNotFound(event);
    }

}



const handleInitiate = async (event) => {
    let item = await findByTrackId(event.payload.contentId);
    if (item) {
        return buildInitiateResponse(event, item);
    } else {
        return buildNotFound(event);
    }
}

const handleGetNextItem = async (event) => {
    let item = await find(null, null);
    if (item) {
        return buildGetNextItem(event, item);
    } else {
        return buildNotFound(event);
    }
}






