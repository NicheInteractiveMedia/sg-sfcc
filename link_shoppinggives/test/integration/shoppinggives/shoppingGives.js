/* global describe, it */


var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);


describe('ShoppingGives: TrackingID', function () {
    var cookieJar = request.jar();
    this.timeout(50000);

    var orderId = null;
    var orderToken = null;
    var trackingId = null;
    var myRequest = {
        url: '',
        method: 'POST',
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        jar: cookieJar,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    };


    it('should returns success true response', function () {
        orderId = '00001002';
        orderToken = 'b3nKjFJqReqxdU6N10xb45BtVunN30vjutEJ_sAsASg';
        trackingId = '1123344r5';
        myRequest.url = config.baseUrl + '/ShoppingGives-TrackingID';
        myRequest.form = {
            orderToken: orderToken,
            orderId: orderId,
            trackingId: trackingId
        };
        return request(myRequest)
            .then(function (response) {
                var bodyAsJson = JSON.parse(response.body);
                assert.isTrue(bodyAsJson.success);
            });
    });

    it('should returns success false response', function () {
        orderId = '0111';
        orderToken = '2222';
        trackingId = '121212';
        myRequest.url = config.baseUrl + '/ShoppingGives-TrackingID';
        myRequest.form = {
            orderToken: orderToken,
            orderId: orderId,
            trackingId: trackingId
        };
        return request(myRequest)
            .then(function (response) {
                var bodyAsJson = JSON.parse(response.body);
                assert.isFalse(bodyAsJson.success);
            });
    });
});
