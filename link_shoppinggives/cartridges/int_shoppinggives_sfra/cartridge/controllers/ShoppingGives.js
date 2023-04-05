'use strict';

var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var OrderMgr = require('dw/order/OrderMgr');
var Logger = require('dw/system/Logger').getLogger('ShoppingGives');
var Transaction = require('dw/system/Transaction');
var server = require('server');

/**
 * ShoppingGives-TrackingID
 * @name int_shoppinggives_sfra/ShoppingGives-TrackingID
 * @function
 * @memberof ShoppingGives
 * @param {middleware} - server.middleware.https
 * @param {middleware} - consentTracking.consent
 * @param {serverfunction} - post
 */
server.post(
    'TrackingID',
    server.middleware.https,
    consentTracking.consent,
    function (req, res, next) {
        var orderId = req.form.orderId;
        var orderToken = req.form.orderToken;
        var trackingId = req.form.trackingId;
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
        res.json({
            success: success
        });
        next();
    });

module.exports = server.exports();
