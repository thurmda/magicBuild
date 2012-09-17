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
        notify(q.branch, q.command, res);
}).listen(commandPort);
console.log('\ntestPusher is accepting commands on port: ' + commandPort);

//SOCKET SERVER (sends commands to agents)
net.createServer(function(c) {
    var id = cid++;
    console.log('\nclient ['+id+'] connected');
    client[id] = c;
    c.on('data' , function(data){
            if(typeof client[id].branch === 'undefined'){
                if(data.toString().substring(0,5)=== 'hello'){
                    client[id].branch = data.toString().substring(6);
                    console.log('\nclient ['+id+'] is and agent for branch : ' + client[id].branch );
                }
            }else{
		    var dat = data.toString();
		    if(dat !== 'ping'){
                        client[id].response += dat;
		    }
            }
        });
    c.on('end', function() {
            console.log('\ncient ['+id+'] disconnected');
            delete client[id];
         });
}).listen(agentPort);
console.log('\ntestPusher is communicating to agents on port: ' + agentPort);



//Sends commands to subscribers and collects responses
function notify(branch, command, res){
    var c, 
        response = {},
	responsePoll,
	start = 0,
	interval = 250,
	counter = 0;
	max = 5 * 60 * 1000 / interval; // 5 minutes

    for(c in client){
        if(client.hasOwnProperty(c)){
            if( client[c] && 
		client[c].writable && 
		client[c].branch && 
		client[c].branch === branch){
    	            response[c] = client[c].response = '';
        	    client[c].write (command);
            }
        }
    }
    if(Object.keys(response).length){
	    res.write('\nExpecting results from '+Object.keys(response).length+' agents');
	    responsePoll = setInterval(checkResponses, interval);
	    function checkResponses(){
		var r;
		counter++;
		for(r in response){
			if(response.hasOwnProperty(r)){
				if(client[r].response.length > 0){
					res.write(client[r].response);
					delete response[r];
				} 
			}
		}
		if(counter >= max || Object.keys(response).length === 0){
			if(Object.keys(response).length){
				res.write('\nTimed out waiting for '+Object.keys(response).length+' responses');
			}
			res.end();
			clearInterval(responsePoll);
		}
	
	    }
    }else{
	res.write('No agents listening for ' + branch + '\n');
	res.end();
    }

}
