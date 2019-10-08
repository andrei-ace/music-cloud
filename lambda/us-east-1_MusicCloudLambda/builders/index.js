const { hash } = require('../utils/');

module.exports = {
    buildNotFound: (event) => {
        return {
            "header": {
                "messageId": 'response_' + event.header.messageId,
                "namespace": "Alexa.Media",
                "name": "ErrorResponse",
                "payloadVersion": "1.0"
            },
            "payload": {
                "type": "CONTENT_NOT_FOUND",
                "message": "Requested content could not be found."
            }
        }
    },

    buildGetPlayableContentResponse: async (event, item) => {
        return {
            "header": {
                "messageId": 'response_' + event.header.messageId,
                "namespace": event.header.namespace,
                "name": "GetPlayableContent.Response",
                "payloadVersion": "1.0"
            },
            "payload": {
                "content": {
                    "id": item.id,
                    "actions": {
                        "playable": true,
                        "browsable": false
                    },
                    "metadata": {
                        "type": "TRACK",
                        "name": {
                            "speech": {
                                "type": "PLAIN_TEXT",
                                "text": item.metadata.common.title
                            },
                            "display": item.metadata.common.title
                        },
                        "authors": item.metadata.common.artist ? [
                            {
                                "name": {
                                    "speech": {
                                        "type": "PLAIN_TEXT",
                                        "text": item.metadata.common.artist
                                    },
                                    "display": item.metadata.common.artist
                                }
                            }
                        ] : {},
                    }
                }
            }
        };
    },

    buildInitiateResponse: async (event, item) => {
        return {
            "header": {
                "messageId": 'response_' + event.header.messageId,
                "namespace": event.header.namespace,
                "name": "Initiate.Response",
                "payloadVersion": "1.0"
            },
            "payload": {
                "playbackMethod": {
                    "type": "ALEXA_AUDIO_PLAYER_QUEUE",
                    "id": hash(event.payload.requestContext.user.id),
                    "rules": {
                        "feedback": {
                            "type": "PREFERENCE",
                            "enabled": false
                        }
                    },
                    "firstItem": {
                        "id": item.id,
                        "playbackInfo": {
                            "type": "DEFAULT"
                        },
                        "metadata": {
                            "type": "TRACK",
                            "name": {
                                "speech": {
                                    "type": "PLAIN_TEXT",
                                    "text": item.metadata.common.title
                                },
                                "display": item.metadata.common.title
                            },
                            "authors": item.metadata.common.artist ? [
                                {
                                    "name": {
                                        "speech": {
                                            "type": "PLAIN_TEXT",
                                            "text": item.metadata.common.artist
                                        },
                                        "display": item.metadata.common.artist
                                    }
                                }
                            ] : {},
                            "art": {}
                        },
                        "controls": [
                            {
                                "type": "COMMAND",
                                "name": "NEXT",
                                "enabled": true
                            },
                            {
                                "type": "COMMAND",
                                "name": "PREVIOUS",
                                "enabled": false
                            }
                        ],
                        "rules": {
                            "feedbackEnabled": false
                        },
                        "stream": {
                            "id": item.id,
                            "uri": item.dropboxMetadata.url,
                            "offsetInMilliseconds": 0,
                            "validUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        }
                    }
                }
            }
        };
    },

    buildGetNextItem: (event, item) => {
        return {
            "header": {
                "messageId": 'response_' + event.header.messageId,
                "namespace": event.header.namespace,
                "name": "GetNextItem.Response",
                "payloadVersion": "1.0"
            },
            "payload": {
                "isQueueFinished": false,
                "item": {
                    "id": item.id,
                    "playbackInfo": {
                        "type": "DEFAULT"
                    },
                    "metadata": {
                        "type": "TRACK",
                        "name": {
                            "speech": {
                                "type": "PLAIN_TEXT",
                                "text": item.metadata.common.title
                            },
                            "display": item.metadata.common.title
                        },
                        "authors": item.metadata.common.artist ? [
                            {
                                "name": {
                                    "speech": {
                                        "type": "PLAIN_TEXT",
                                        "text": item.metadata.common.artist
                                    },
                                    "display": item.metadata.common.artist
                                }
                            }
                        ] : {},
                        "art": {}
                    },
                    "controls": [
                        {
                            "type": "COMMAND",
                            "name": "NEXT",
                            "enabled": true
                        },
                        {
                            "type": "COMMAND",
                            "name": "PREVIOUS",
                            "enabled": false
                        }
                    ],
                    "rules": {
                        "feedbackEnabled": false
                    },
                    "stream": {
                        "id": item.id,
                        "uri": item.dropboxMetadata.url,
                        "offsetInMilliseconds": 0,
                        "validUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    }
                }
            }
        };
    },
    buildInternalError: (event) => {
        return {
            "header": {
                "messageId": 'response_' + event.header.messageId,
                "namespace": "Alexa.Audio",
                "name": "ErrorResponse",
                "payloadVersion": "1.0"
            },
            "payload": {
                "type": "INTERNAL_ERROR",
                "message": "Unknown error"
            }
        };
    },
    buildGetPreviousItem: (event) => {
        return {
            "header": {
                "messageId": 'response_' + event.header.messageId,
                "namespace": "Alexa.Audio",
                "name": "ErrorResponse",
                "payloadVersion": "1.0"
            },
            "payload": {
                "type": "ITEM_NOT_FOUND",
                "message": "There is no previous item."
            }
        };
    }
}