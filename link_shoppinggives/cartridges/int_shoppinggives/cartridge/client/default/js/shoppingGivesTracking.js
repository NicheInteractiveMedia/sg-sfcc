'use strict';

if (window && !window.$) { // this check is for SG, in SG window.$ is already exist and throw error on reinitialize
    window.jQuery = window.$ = require('jquery');
}
/**
 * @function getTrackingId
 * @param {string} storeId - storeId
 * @returns {string} trackingId
 */
function getTrackingId(storeId) {
    try {
        var result;
        var normalizedStoreId = storeId.replace(/-/g, '').toLowerCase();
        try {
            result = sessionStorage.getItem('sg.sid-' + normalizedStoreId);
        } catch (e) {
            if (window.name) {
                return window.atob(window.name);
            }
        }
        if (result) {
            return window.atob(result);
        } else if (window.name) {
            // failed to retrieve from session storage, tracking is set to a    backup window variable in the case it fails to set to session
            return window.atob(window.name);
        }
    } catch (ex) {
        console.log('ShoppingGives-getTrackingId -> TrackingId not found: ' + ex.toString() + ' in ' + ex.fileName + ' : ' + ex.lineNumber + ''); // eslint-disable-line
    }
    return null;
}


$(function () {
    var $shoppingGivesTracking = $('.shopping-gives-tracking');
    var storeId = $shoppingGivesTracking.data('shopping-gives-store-id');
    var orderId = $shoppingGivesTracking.data('order-id');
    var orderToken = $shoppingGivesTracking.data('order-token');
    var trackingURL = $shoppingGivesTracking.data('tracking-url');
    var trackingId = getTrackingId(storeId);
    $.ajax({
        url: trackingURL,
        dataType: 'JSON',
        type: 'POST',
        data: {
            orderId: orderId,
            orderToken: orderToken,
            trackingId: trackingId
        },
        success: function () {
        },
        error: function () {
        }
    });
});
