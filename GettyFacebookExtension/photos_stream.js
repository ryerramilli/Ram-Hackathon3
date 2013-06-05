// Handle user's desire to reply on a facebook thread
$(document).on('click', '#contentArea textarea', reply);
var replyTextBoxes = {};
function reply(commentArea) {
    
    var scope =  $(commentArea.target).parent().parent().parent().parent().parent();
    
    var buttons = $('.gettyimages_viewimages', scope);
    if(buttons.length == 0) {
        var linkId = 'gettyimages_viewimages_link_' + new Date().getTime();
        scope.append('<a class="gettyimages_viewimages" id="' + linkId + '">open getty offers...</a>');
        replyTextBoxes[linkId] = commentArea.target;
    }
       
}

$(document).on('click', '.gettyimages_viewimages', showContent);
function showContent(gettyLink) {
    
    var panels = $('#gettyimages_contentPanel');
    
    if (panels.length == 0)
        constructPanel();
    
    panels = $("#gettyimages_contentPanel");
    
    panels.attr('data-content-launcher', $(gettyLink.target).attr('id'));
    panels.show();
    
}

$(document).on('click', '.gettyimages_editor_picked_image', handleUserSelection);
function handleUserSelection(selectionEvent) {
    
    var launcherId = $("#gettyimages_contentPanel").attr('data-content-launcher');
    
    var clickThru = $(event.target).attr('clickThru');
    
    var replyTextBox = replyTextBoxes[launcherId];
    
    $(replyTextBox).focus();
    $(replyTextBox).val(clickThru);
    
    hideContent();
}

$(document).on('click', '#gettyimages_editors_picks_menu_item', showEditorPicks);
function showEditorPicks() {
    $('#gettyimages_explore_images').hide();
    $('#gettyimages_editor_picks').show();
}

$(document).on('click', '#gettyimages_explore_menu_item', showExploreOptions);
function showExploreOptions() {
    $('#gettyimages_explore_images').show();
    $('#gettyimages_editor_picks').hide();
}

$(document).on('click', '#gettyimages_explore_button', handleSearch);
function handleSearch() {
    
    var searchTerm = $('#gettyimages_search_box').val();
    
    port.postMessage({'request' : 'search', 'term' : searchTerm});
    
}

$(document).on('click', "#getyimages_close_viewimages", hideContent);

var topics = [];

var portResponseHandlers = { 'editor_picks' : receiveEditorPicks, 'search' : receiveSearchResults};
$(document).ready(openConnection);
function openConnection() {
    
    port = chrome.runtime.connect();
    
    port.postMessage({'request' : 'editor_picks'});
    
    port.onMessage.addListener(function(response) {
        console.log('Received Content');
        portResponseHandlers[response.request](response.data);
    });
}

function receiveEditorPicks(data) {
    topics = data;
    console.log('data is ready');
}

function receiveSearchResults(images) {
    
    var html = '<div id="gettyimages_dynamic_srp">';
    for(var idx=0; idx < images.length; idx++) {
        
        if(idx % 4 == 0)
            html += '<div>';
            
        html += '<img class="gettyimages_editor_picked_image" src="' + images[idx].thumb + '" clickThru="' + images[idx].clickThru  + '"/>';
        
        if(idx % 4 == 0)
            html += '</div>';
    }
    html += '</div>';
    
    $('#gettyimages_dynamic_srp').replaceWith(html);
}


function hideContent() {
    $("#gettyimages_contentPanel").hide();    
}

function attachTopics() {
  
    var contentPanel = $('#gettyimages_editor_picks');
    
    for(var t = 0; t < topics.length; t++) {
        
        var c = '<div id="gettyimages_' + topics[t].name + '" class="getty_images_editor_topics">'
        + '<div class="gettyimages_topic_titles">' + topics[t].name + '</div>';
        
        c += '<div style="margin-left:40px;">'
        
        for(var i=0; i < topics[t].images.length; i++) {
            c += '<img class="gettyimages_editor_picked_image" src="' + topics[t].images[i].thumb + '" clickThru="' + topics[t].images[i].clickThru  + '"/>';
        }
        
        
        c += '</div></div>';
        
        contentPanel.append(c);
    }
}

function constructPanel() {
    $('#contentArea').prepend('<div id="gettyimages_contentPanel"></div>');
    var contentPanel = $('#gettyimages_contentPanel');
    contentPanel.append('<div>');
    contentPanel.append('<div id="gettyimages_view_images_panel"><a id="gettyimages_explore_menu_item">Explore Gettyimages on your own</a><span>or</span><a id="gettyimages_editors_picks_menu_item">GettyImages Editor\'s picks</a> </div>');
    contentPanel.append('<div id="gettyimages_editor_picks"></div>');
    contentPanel.append('<div id="gettyimages_explore_images"><input type="text" name="gettyimages_searchbox" size="30" id="gettyimages_search_box"></input><button id="gettyimages_explore_button">Explore Gettyimages on your own</button>  <div id="gettyimages_dynamic_srp"></div> </div></div>');
    
    attachTopics();
    
    contentPanel.show();
    showEditorPicks();
}

$(document).ready(insertStyle);
function insertStyle() {
    var styling = '<style type="text/css">'
           + '#gettyimages_view_images_panel a {font-variant: small-caps; font-size: 3em;float:right; margin-left:10px; marign-right:10px; display: block; }'
           + '#gettyimages_conentPanel input {display: block;}'
           + '#gettyimages_explore_images {display: none;}'
           + '#gettyimages_explore_images {display: none;}'
           + '#gettyimages_contentPanel {display: none; z-index:100000;position: fixed;top: 40px; left: 100px; height: 1000px; width: 1600px;}'
           + '#gettyimages_view_images_panel {-webkit-transform: rotate(-90deg) translateX(-1700px) translateY(-40px); -webkit-transform-origin: 0 0;}'
           + '#gettyimages_view_images_panel span {display: block; float: right; font-size: 3em; color: red; margin-left: 10px; margin-right: 10px;}'
           + '.getty_images_editor_topics {height: 250px;}'
           + '.gettyimages_topic_titles {-webkit-transform: rotate(-90deg) translateX(-150px); width: 200px; -webkit-transform-origin: 0 0; font-variant: small-caps; font-size: 2em;}'
           + '.gettyimages_editor_picked_image {margin-left: 5px; width: 240px; border-radius: 5px; border-width: 2px; border-style: outset;}'
        + "</style>";
        
    $("body").append(styling);
}