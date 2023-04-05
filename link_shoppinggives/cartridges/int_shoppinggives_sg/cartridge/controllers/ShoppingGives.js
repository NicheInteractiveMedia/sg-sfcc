/* eslint-disable */
'use strict';

var guard = require('*/cartridge/scripts/guard');
var Logger = require('dw/system/Logger').getLogger('ShoppingGives');
var OrderMgr = require('dw/order/OrderMgr');
var params = request.httpParameterMap;
var res = require('*/cartridge/scripts/util/Response');
var Transaction = require('dw/system/Transaction');

function TrackingID() {
    var orderId = params.orderId.value;
    var orderToken = params.orderToken.value;
    var trackingId = params.trackingId.value;
    var success = false;
    if (!empty(orderId) && !empty(orderToken) && !empty(trackingId)) {
        Transaction.wrap(function () {
            var order = OrderMgr.getOrder(orderId, orderToken);
            if (!empty(order)) {
                order.custom.shoppingGivesTrackingId = trackingId;
                success = true;
            }
        });
    } else {
        Logger.error('ShoppingGives -> OrderId {0},orderToken {1} and Tracking ID {2} not found', orderId, orderToken, trackingId);
    }
    res.renderJSON({
        success: success
    });
}

exports.TrackingID = guard.ensure(['post'], TrackingID);
