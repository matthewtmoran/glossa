// var spacebroClient = require('../node_modules/spacebro-client/dist/spacebro-client');
var spacebroClient = require('spacebro-client');

spacebroClient.connect('127.0.0.1', 8888);

spacebroClient.on('hello', function (data) {
    console.log('received hello', data)
});

setTimeout(function() { spacebroClient.emit('hello', 'world') }, 3000);
setTimeout(function() { spacebroClient.emit('hello', {world: 'hello'}) }, 5000);
setTimeout(function() { spacebroClient.off('hello') }, 6000);
setTimeout(function() { spacebroClient.emit('hello') }, 7000);

spacebroClient.on('new-member', function(data){
    console.log(data.member + 'has joined.');
});
