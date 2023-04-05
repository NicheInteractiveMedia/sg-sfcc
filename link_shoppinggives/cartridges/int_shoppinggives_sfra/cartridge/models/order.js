'use strict';
var base = module.superModule;
/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {Object} options - The current order's line items
 * @constructor
 */
function OrderModel(lineItemContainer, options) {
    base.call(this, lineItemContainer, options);
    this.orderToken = 'orderToken' in lineItemContainer ? lineItemContainer.orderToken : null;
}

module.exports = OrderModel;
