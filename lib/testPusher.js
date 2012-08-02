#!/usr/bin/node
/*
testPusher.js

Author: Dan Thurman

This is a small app that is used to push notifications to subscribing test agents
 
*/

var net = require('net'),
    http = require('http'),
    url = require('url');

var commandPort = process.argv[2],
    agentPort = process.argv[3],
    client = {},
    cid=0;

//HTTP SERVER (accepts commands)
http.createServer(function (req, res) {
    var q;
    
    res.writeHead(200, {'Content-Type': 'text/plain'});
    q = url.parse(req.url, true).query;
    if(q.branch){
        notify(q.branch, q.command, res, res.end);
    }else{
        res.end();    
    }
}).listen(commandPort);
console.log('testPusher is accepting commands on port: ' + commandPort);

//SOCKET SERVER (sends commands to agents)
net.createServer(function(c) {
    var id = cid++;
    console.log('client ['+id+'] connected');
    client[id] = c;
    c.on('data' , function(data){
            if(typeof client[id].branch === 'undefined'){
                if(data.toString().substring(0,5)=== 'hello'){
                    client[id].branch = data.toString().substring(6);
                    console.log('client ['+id+'] is and agent for branch : ' + client[id].branch );
                }
            }else{
                    console.log('OUTPUT (from client['+id+'] : ' + data.toString());
                    client[id].response += data.toString();
            }
        });
    c.on('end', function() {
            console.log('cient ['+id+'] disconnected');
            delete client[id];
         });
}).listen(agentPort);
console.log('testPusher is communicating to agents on port: ' + agentPort);



//Sends commands to subscribers and collects responses
function notify(branch, command, res, callback){
    var c, 
        pendingResponse = [];

    for(c in client){
        if(client.hasOwnProperty(c)){
            if(client[c] && client[c].writable && 
                client[c].branch && client[c].branch === branch){
                pendingResponse.push(c);
                client[c].waiting = true;
                client[c].response = '';
                client[c].write (command);
            }
        }
    }
    while (pendingResponse.length > 0 ){

       }
}
