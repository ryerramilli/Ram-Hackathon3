// This is  HTTP Service
var http = require('http');
var https = require('https');
var querystring = require('querystring');

var urlHelper = require('url');
var transport = require('./../Integration/Transport.js');
var util = require('util');
var log4js = require('log4js');

var facebook_access_token = 'CAAFgSDOA6x4BAE1M7UHqAmYKMuuWniHNROZAHFKPLpJhy53OHyWix5lN6rpDhw1ZCfilfzxdlCySP2wcpyBq2tcub8olsZCNLMTgDQ5AO064h2B78fAKIbzQXFluAypm9FdfZBi4coaWw47ttbRXCXij06LgvUcZD';

var archives = {'name' : 'Archives', images : []};
var travel = {'name' : 'Travel', images : []};
var sports = {'name' : 'Sports', images : []};
var wildlife = {'name' : 'Wildlife', images: []};
    
var topics = [sports, wildlife, travel, archives];
    
var picks = {
        "51395762" : archives,
        "51731301" : archives,
        "90745540" : archives,
        "3427460" : archives,
        "2635796" : archives,
        "3137650" : archives,
        
        "AB62749" : travel,
        "a0194-000105" : travel,
        "85887836" : travel,
        "6045-000093" : travel,
        "103338165" : travel,
        "136486117" : travel,
        
        "169910842" : sports,
        "169796673" : sports,
        "169796601" : sports,
        "169338345" : sports,
        "72561567" : sports,
        "98165680" : sports,
        
        "dv842142" : wildlife,
        "E000702" : wildlife,
        "121832681" : wildlife,
        "102580876" : wildlife,
        "55949582" : wildlife,
        "dv842068" : wildlife
         
};

var logger = log4js.getLogger('SubmissionManagementSvc');
logger.setLevel('INFO');

var routeHandlers = {
        'GET' : { '/editor_picks' : getEditorPicks, '/search' :  search, '/download' : download}
    };
    
var createSessionUrl = 'https://connect.gettyimages.com/v1/session/CreateSession';
var createSessionRequest = {'RequestHeader' : {'Token' : null, 'CoordinationId' : null},
        'CreateSessionRequestBody' : { 'SystemId' : '10212', 'SystemPassword' : 'RQdCMXOOyWHnUhhQtuivnx8NzEOIXINfsa5zSFPJGK4=', 'UserName' : 'hackathon3_api', 'UserPassword' : 'pDuo9fbScAK0LTW'}};
    
function download(callback, downloadRequest) {
        
        console.log('Received request to dowload ' + downloadRequest.filters.assetid);
        
        fetchEditorPicks( [downloadRequest.filters.assetid], function(result) {
                
                console.log('Reced response from fetch editor picks');
                console.log(result);
                
                var images = result.GetImageDetailsResult.Images;
                
                if(images.length > 0) {
                        
                        console.log('Posting to facebook');
                        
                        var imageUrl = images[0].UrlPreview;
                        
                        var formdata = {
                              'access_token' : facebook_access_token,
                              'url' : imageUrl
                        };
                        
                        var postdata = querystring.stringify(formdata);
                        
                        var headers = { 'content-type' : 'application/x-www-form-urlencoded', 'content-length' : postdata.length};
                        
                        var request = https.request( {'hostname':'graph.facebook.com', 'path': '/128307660707725/photos', 'method': 'POST', 'headers' : headers} , function(response) {
                
                                console.log('Posting to facebook is complete');
                                var data = '';
                                response.on('data', function(chunk) {
                                    data += chunk;
                                });
        
                                response.on('end', function() {
            
                                        if(response.statusCode == 200) {
                                                console.log(response.statusCode);
                                                console.log(response.headers);
                                                console.log(data);
                                        }
                                        else {
                                            console.log(response.statusCode);
                                            console.log(response.headers);
                                        }
                        
                                        var downloadResult = {};
                                        callback({ 'statusCode': 200, payload: new transport.serializers.json(downloadResult)});
                                });
                        });
                        
                        request.write(postdata);
                        request.end();
                
                }
                     
        });        
}

function search(callback, searchRequest) {
        
        logger.info('Received search request');
        
        var searchResults = [];
        
        var searchImagesQuery = {
                "RequestHeader": {
                        "Token": null,
                        "CoordinationId": null
                },
                "SearchForImages2RequestBody": {
                        "Filter" : { "Orientations" : ["Horizontal"]},
                        "Query": {
                                "SearchPhrase": searchRequest.filters['term']
                        },
                        "ResultOptions": {
                                "IncludeKeywords": false,
                                "ItemCount": 12,
                                "ItemStartNumber": 1
                        }
                }
        };
                
        var payload = createSessionRequest;
        var message = { 'payload' : new transport.serializers.json(payload)};
        
        transportSend('/v1/session/CreateSession', 'POST', message, function(result) {
                
                searchImagesQuery.RequestHeader.Token = result.CreateSessionResult.Token;
                
                var searchImagesQueryMessage = { 'payload' : new transport.serializers.json(searchImagesQuery)};
                
                
                transportSend('/v1/search/SearchForImages', 'POST', searchImagesQueryMessage, function(result) {
                        
                        var images = result.SearchForImagesResult.Images;
                        for(var idx=0; idx < images.length; idx++) {
                                var thumbUrl = images[idx].UrlWatermarkPreview?images[idx].UrlWatermarkPreview:images[idx].UrlThumb;
                                if(searchRequest && searchRequest.filters['subscriber'] == 'yes' && images[idx].UrlPreview)
                                        thumbUrl = images[idx].UrlPreview;
                        
                                var clickThru = images[idx].ReferralDestinations && images[idx].ReferralDestinations > 0 ?images[idx].ReferralDestinations[0].Url : ("http://www.gettyimages.com/detail/" + images[idx].ImageId);
                                
                                searchResults.push({ 'id' : images[idx].ImageId, 'thumb' : thumbUrl, 'clickThru' : clickThru});
                        }
                        
                        callback({ 'statusCode': 200, payload: new transport.serializers.json(searchResults)});
                });
        });
}

function getEditorPicks(callback, viewMode) {
    
    logger.info('Received request');
    
    var pickedImages = [];
    for(var id in picks)
        pickedImages.push(id);
    
    for(var i=0; i < topics.length; i++)
        topics[i].images = [];
    fetchEditorPicks(pickedImages, function(result) {
        
        var images = result.GetImageDetailsResult.Images;
        for( var idx =0; idx < images.length; idx++) {
                
                var thumbUrl = images[idx].UrlWatermarkPreview?images[idx].UrlWatermarkPreview:images[idx].UrlThumb;
                if(viewMode && viewMode.filters['subscriber'] == 'yes' && images[idx].UrlPreview)
                        thumbUrl = images[idx].UrlPreview;
                
                var clickThru = images[idx].ReferralDestinations && images[idx].ReferralDestinations > 0 ?images[idx].ReferralDestinations[0].Url : ("http://www.gettyimages.com/detail/" + images[idx].ImageId);
                
                picks[images[idx].ImageId].images.push({ 'id' : images[idx].ImageId, 'thumb' : thumbUrl, 'clickThru' : clickThru});
        }
    
        callback({ 'statusCode': 200, payload: new transport.serializers.json(topics)});
    
    });
    
}

function fetchEditorPicks(pickids, editorPicksReceiver) {
                
        var getImageDetails = {
                "RequestHeader": {
                        "Token": null,
                        "CoordinationId": null
                },
                "GetImageDetailsRequestBody": {
                        "CountryCode": "usa",
                        "ImageIds": pickids
                }
        };
                
        var payload = createSessionRequest;
        var message = { 'payload' : new transport.serializers.json(payload)};
        
        transportSend('/v1/session/CreateSession', 'POST', message, function(result) {
                
                getImageDetails.RequestHeader.Token = result.CreateSessionResult.Token;
                
                var getImageDetailsMessage = { 'payload' : new transport.serializers.json(getImageDetails)};
                
                transportSend('/v1/search/GetImageDetails', 'POST', getImageDetailsMessage, function(r) {
                        editorPicksReceiver(r);
                });
        });
}

function transportSend (resource, method, message, responseHandler) {

        var headers = { 'content-type' : 'application/json'};
        var request = https.request( {'hostname':'connect.gettyimages.com', 'path': resource, 'method': method, 'headers' : headers} , function(response) {
        
                var data = '';
                response.on('data', function(chunk) {
                    data += chunk;
                });
        
                response.on('end', function() {
            
                        if(response.statusCode == 200) {
                                var obj = JSON.parse(data);
                                responseHandler(obj);
                        }
                        else {
                            console.log(response.statusCode);
                            console.log(response.headers);
                        }
                });
        
    });
    
    if(message && message.payload) {
        request.write(message.payload.getString(), 'utf-8');
    }
    
    request.end();
    
}

function requestHandler(inStream, outStream) {
    
    var data = '';
    inStream.on('data', function(chunk) {
        data += chunk;
    });
    
    inStream.on('end', function() {
       
       var obj =   {};
       
       try {
        obj["payload"] = JSON.parse(data);
       }
       catch(err) {}
       
       var method = inStream.method.toUpperCase();
       var urlParts = urlHelper.parse(inStream.url.toLowerCase(), true);
       var resource = urlParts.pathname;
       console.log(resource);
       obj["filters"] = urlParts.query;
       
       function onResult(result) {
                outStream.writeHead(result.statusCode);
                if( result.payload) outStream.write( result.payload.getString(), 'utf-8');
                        outStream.end(); 
        }
       
       if(routeHandlers[method] && routeHandlers[method][resource])
            routeHandlers[method][resource](onResult, obj);
       else
            onResult({ 'statusCode': 404});
        
    });
}

var server = http.createServer(requestHandler);

var port = 7777;
server.listen(port);
logger.info('Listening on port %d', port);