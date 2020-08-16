const AWS = require('aws-sdk');

//tested
exports.unregsiterationHandler = async function (event, context) {
    const apiKey = process.env.API_KEY;
    let jsonData = JSON.parse(event.body);
    let resp;
    let iot = new AWS.IotData({
        endpoint: 'a2z5jqpgpakn2-ats.iot.ap-south-1.amazonaws.com',
        region: 'ap-south-1'
    });

    if (jsonData.apiKey == apiKey) {
        try {
            const shadowDoc = {
                'state': {
                    'desired': {
                        'activated':0
                    }
                }
            };
            await iot.updateThingShadow({
                payload: Buffer.from(JSON.stringify(shadowDoc)),
                thingName: jsonData.deviceId
            }).promise();
            resp = {
                statusCode: 200,
                body: JSON.stringify({
                    'result':'device unregistered'
                })
            };

            console.log(resp);
        }
        catch (err) {
            resp = {
                statusCode: 500,
                body: JSON.stringify({
                    'result':'error'
                })
            };
            console.log(err);
        }
        return resp;
    }
    else {
        console.log("invaled auth: " + event.body);
        return {
            statusCode: 401,
            body: JSON.stringify({
                'result': 'invalid authentication'
            })
        };
    }
}

//tested
exports.regsiterationHandler = async function (event, context) {
    const apiKey = process.env.API_KEY;
    let jsonData = JSON.parse(event.body);
    let resp;
    let iot = new AWS.IotData({
        endpoint: 'a2z5jqpgpakn2-ats.iot.ap-south-1.amazonaws.com',
        region: 'ap-south-1'
    });

    if (jsonData.apiKey == apiKey) {
        try {
            const shadowDoc = {
                'state': {
                    'desired': {
                        'ssid':jsonData.ssid,
                        'pass':jsonData.pass,
                        'pmac':jsonData.pmac,
                        'ptoken':jsonData.ptoken,
                        'nodeId':jsonData.nodeId,
                        'nodeURL':jsonData.nodeURL,
                        'activated':1
                    }
                }
            };
            await iot.updateThingShadow({
                payload: Buffer.from(JSON.stringify(shadowDoc)),
                thingName: jsonData.deviceId
            }).promise();
            resp = {
                statusCode: 200,
                body: JSON.stringify({
                    'result':'device registered'
                })
            };

            console.log(resp);
        }
        catch (err) {
            resp = {
                statusCode: 500,
                body: JSON.stringify({
                    'result':'error'
                })
            };
            console.log(err);
        }
        return resp;
    }
    else {
        console.log("invaled auth: " + event.body);
        return {
            statusCode: 401,
            body: JSON.stringify({
                'result': 'invalid authentication'
            })
        };
    }
}

exports.ingestDignostic = async function (event, context) {
    
    return;
}

//tested
exports.sendCommand = async function (event, context) {
    const apiKey = process.env.API_KEY;
    let jsonData = JSON.parse(event.body);

    if (jsonData.apiKey == apiKey) {
        let resp,cmdId;
        let iot = new AWS.IotData({
            endpoint: 'a2z5jqpgpakn2-ats.iot.ap-south-1.amazonaws.com',
            region: 'ap-south-1'
        });
        let db = new AWS.DynamoDB.DocumentClient({
            region:'ap-south-1'
        });
        const topic = 'cmd/' + jsonData.nodeId;
        try {
            await db.put({
                TableName:'cmdRepo',
                Item: {
                    requestsp:jsonData.request,
                    statusp:'pending',
                    resultsp:'',
                    cmdId: context.awsRequestId
                }
            }).promise();

            await iot.publish({
                topic:topic,
                payload: Buffer.from(JSON.stringify({
                    request:jsonData.request,
                    cmdId:context.awsRequestId
                })),
                qos:1
            }).promise();
            resp = {
                statusCode: 200,
                body: JSON.stringify({
                    'cmdId':context.awsRequestId,
                    'result':'command sent'
                })
            };
            console.log(resp);
        }
        catch (err) {
            resp = {
                statusCode: 500,
                body: JSON.stringify({
                    'result':'error sending command'
                })
            };
            console.log(err);
        }
        return resp;
    }
    else {
        console.log("invaled auth: " + event.body);
        return {
            statusCode: 401,
            body: JSON.stringify({
                'result': 'invalid authentication'
            })
        };
    }
}

//tested
exports.ingestCmdResult = async function (event, context) {
    try{
        let db = new AWS.DynamoDB.DocumentClient({
            region:'ap-south-1'
        });
        let resp = await db.update({
            TableName:'cmdRepo',
            Key:{
                cmdId: event.cmdId
            },
            UpdateExpression:"set resultsp = :r, requestsp=:p, statusp=:s",
            ExpressionAttributeValues:{
                ":r":event.resultsp,
                ":p":event.requestsp,
                ":s":event.statusp
            },
            ReturnValues:"UPDATED_NEW"
        }).promise();
        console.log(resp);
    }
    catch(err) {
        console.log(err);
    }
    return;
}

//tested
exports.getCmdResult = async function (event, context) {
    const apiKey = process.env.API_KEY;
    let jsonData = JSON.parse(event.body);
    if (jsonData.apiKey == apiKey) {

        let resp;

        try{
            let db = new AWS.DynamoDB.DocumentClient({
                region:'ap-south-1'
            });
            let doc= await db.get({
                TableName:'cmdRepo',
                Key:{
                    cmdId:jsonData.cmdId
                }
            }).promise();

            doc.Item["result"] = 'success';

            resp = {
                statusCode:200,
                body: JSON.stringify(doc.Item)
            };
        }
        catch(err) {
            resp = {
                statusCode:500,
                body:JSON.stringify({
                    'result': 'internal error'
                })
            };
        }
        
        return resp;
    }
    else {
        console.log("invaled auth: " + event.body);
        return {
            statusCode: 401,
            body: JSON.stringify({
                'result': 'invalid authentication'
            })
        };
    }
}

exports.getConnState = async function(event,context) {
    const apiKey = process.env.API_KEY;
    let jsonData = JSON.parse(event.body);

    if (jsonData.apiKey == apiKey) {
        let resp;
        try {
            const iot = new AWS.Iot({
                apiVersion: "2015-05-28"
            });

            const iotSearch = await iot.searchIndex({
                queryString:'thingName:'+jsonData.deviceId,
                indexName:'AWS_Things'
            }).promise();

            let connState = iotSearch.things[0];
            connState['result'] = 'success';
            resp = {
                statusCode: 200,
                body: JSON.stringify(connState)
            };
            console.log(iotSearch);
        }
        catch (err) {
            resp = {
                statusCode: 500,
                body: JSON.stringify({
                    'result':'error getting device state'
                })
            };
            console.log(err);
        }
        return resp;
    }
    else {
        console.log("invaled auth: " + event.body);
        return {
            statusCode: 401,
            body: JSON.stringify({
                'result': 'invalid authentication'
            })
        };
    }
}