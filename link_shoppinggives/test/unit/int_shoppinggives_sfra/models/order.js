'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

function orderMock() {
    return this;
}

var mockLineItemContainer = {
    orderToken: '123'
};

describe('OrderModel Properties', function () {
    var OrderModel;
    before(function () {
        module.__proto__.superModule = orderMock; // eslint-disable-line no-proto
        OrderModel = proxyquire('../../../../cartridges/int_shoppinggives_sfra/cartridge/models/order', {});
    });

    it('should call order model', function () {
        var options = {};
        var orderModel = new OrderModel(mockLineItemContainer, options);
        assert.isObject(orderModel);
    });

    it('should get orderToken', function () {
        var options = {};
        var result = new OrderModel(mockLineItemContainer, options);
        assert.equal(result.orderToken, '123');
    });

    it('should not get orderToken', function () {
        var options = {};
        mockLineItemContainer.orderToken = null;
        var result = new OrderModel(mockLineItemContainer, options);
        assert.isNull(result.orderToken);
    });
});

