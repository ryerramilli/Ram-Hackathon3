function handleMessage(message) {
    
    console.log('Received Message');
    
}

function handleConnection(port) {
    
    console.log('Received Connection');
    port.onMessage.addListener(function(msg) {
         
         var webServiceRequest = new XMLHttpRequest();
         
         webServiceRequest.onreadystatechange = function () {
            
            if(webServiceRequest.readyState == 4) {
                port.postMessage( {'request': msg.request, 'data' : JSON.parse(webServiceRequest.responseText)});
            }
            
         };
         
         if(msg.request == 'editor_picks') {
            webServiceRequest.open('GET', "http://localhost:7777/editor_picks?subscriber=" + msg.subscriber);
         }
         else if(msg.request == 'search') {
            webServiceRequest.open('GET', "http://localhost:7777/search?subscriber=" + msg.subscriber + "&term=" + msg.term);
         }
         else if(msg.request == 'download') {
            webServiceRequest.open('GET', "http://localhost:7777/download?subscriber=" + msg.subscriber + "&assetId=" + msg.imageId);
         }
         
         webServiceRequest.send();     
        
    });
    
}

function init() {

    console.log('Waiting for connection');

    chrome.runtime.onConnect.addListener(handleConnection);

}

init();