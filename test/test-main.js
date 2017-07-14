var assert = require('assert');
var fs = require('fs');
var html = fs.readFileSync("static/main.html", { encoding: 'utf-8' })
require('jsdom-global')(html);



describe('testing GeocodeCallCenter class', function() {

    var GeocodeCallCenter = require('../static/main.js').GeocodeCallCenter;

    var i;
    var geoCallCenter;
    var func = function() {
        console.log("CALL NUMBER " + ++i);
        var error = null;
        if (i == 5)
            error = "some error";
        geoCallCenter.notifyCallFinished(error);
    };

    beforeEach(function() {
        i = 0;
        geoCallCenter = new GeocodeCallCenter(func, 10);
    });


    it('execute 10 calls', function() {
        for (var i = 0; i < 10; i++) {
            geoCallCenter.call();
        }
        assert.equal(geoCallCenter.finishedCalls, 10);
        assert.equal(geoCallCenter.ongoingCalls, 0);
        assert.equal(geoCallCenter.queuedCalls.length, 0);
        assert.equal(document.querySelector("#loading-message").textContent, "Loading 10/10");
    });


    it('store error if happened, and notify it only at the end', function() {
        var j = 0;
        document.querySelector('#notification').querySelector('p').textContent = "";
        for (; j < 6; j++) {
            geoCallCenter.call();
        }
        assert.notEqual(geoCallCenter.happenedError, undefined);
        assert.equal(document.querySelector('#notification').querySelector('p').textContent, "");
        for (; j < 10; j++) {
            geoCallCenter.call();
        }
        assert.notEqual(document.querySelector('#notification').querySelector('p').textContent, "");
    });


    it('execute only totalCalls number of calls', function() {
        for (var j = 0; j < 15; j++) {
            geoCallCenter.call();
        }
        assert.equal(geoCallCenter.finishedCalls, 10);
        assert.equal(geoCallCenter.ongoingCalls, 0);
        assert.equal(geoCallCenter.queuedCalls.length, 0);
        assert.equal(document.querySelector("#loading-message").textContent, "Loading 10/10");
    });

});