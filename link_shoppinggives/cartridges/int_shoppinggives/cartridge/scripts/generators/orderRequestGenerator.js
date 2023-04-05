'use strict';

var Logger = require('dw/system/Logger');
var shoppingGivesConstant = require('*/cartridge/scripts/util/shoppingGivesConstant');

var adjustment = null;
var priceAdjustments = null;
var promoCodes = [];

/**
 * get shipping level promotions and promoCodes
 * @param {Object} order - order
 */
function getShippingPromoCodes(order) {
    var shippingLineItems = order.shipments.iterator();
    var shippingLineItem = null;
    var shippingPriceAdjuments = null;
    var shippingPriceAdjument = null;
    while (shippingLineItems.hasNext()) {
        shippingLineItem = shippingLineItems.next();
        shippingPriceAdjuments = shippingLineItem.shippingPriceAdjustments.iterator();
        while (shippingPriceAdjuments.hasNext()) {
            shippingPriceAdjument = shippingPriceAdjuments.next();
            if (promoCodes.indexOf(shippingPriceAdjument.promotion.name) === -1) {
                promoCodes.push(shippingPriceAdjument.promotion.name);
            }
        }
    }
}

/**
 * get order level promotions
 * @param {Object} order - order
 * @returns {Object} - object of orderAdjustment amount and list of promo codes
 */
function getOrderPromotions(order) {// eslint-disable-line
    try {
        var orderAdjustmentTotal = 0;
        priceAdjustments = order.priceAdjustments.iterator();
        while (priceAdjustments.hasNext()) {
            adjustment = priceAdjustments.next();
            orderAdjustmentTotal += (adjustment.basePrice.value * -1);
            if (promoCodes.indexOf(adjustment.promotion.name) === -1) {
                promoCodes.push(adjustment.promotion.name);
            }
        }
        return {
            orderAdjustmentTotal: orderAdjustmentTotal,
            promoCodes: promoCodes
        };
    } catch (ex) {
        Logger.error('(ShoppingGives~getOrderPromotions) -> Error occured while generating promotion payload and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
}

/**
 * get order line items list
 * @param {Object} order - order
 * @returns {Array} - list of order line items
 */
function getOrderLineItems(order) {// eslint-disable-line
    try {
        var orderLineItems = [];
        var lineItems = order.getProductLineItems().iterator();
        var lineItem;
        var lineItemAdjustmentTotal = 0;
        while (lineItems.hasNext()) {
            lineItemAdjustmentTotal = 0;
            lineItem = lineItems.next();
            priceAdjustments = lineItem.priceAdjustments.iterator();
            while (priceAdjustments.hasNext()) {
                adjustment = priceAdjustments.next();
                lineItemAdjustmentTotal += (adjustment.basePrice.value * -1);
                if (promoCodes.indexOf(adjustment.promotion.name) === -1) {
                    promoCodes.push(adjustment.promotion.name);
                }
            }
            orderLineItems.push({
                id: lineItem.productID,
                quantity: lineItem.quantity.value,
                sku: lineItem.productID,
                description: lineItem.lineItemText,
                costPerItem: lineItem.basePrice.value,
                discount: lineItemAdjustmentTotal
            });
        }
        return orderLineItems;
    } catch (ex) {
        Logger.error('(ShoppingGives~getOrderLineItems) -> Error occured while generating line item payload and error is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
}

/**
 * get order object to be exported
 * @param {Object} order - order
 * @returns {Object} - order object
 */
function processOrders(order) {// eslint-disable-line
    try {
        promoCodes = []; // reinitialize on each order
        getShippingPromoCodes(order);
        var orderPromo = getOrderPromotions(order);
        var shoppingGiveOrder = {
            storeId: shoppingGivesConstant.SHG_CONSTANTS.SHG_STORE_ID,
            orderId: order.orderNo,
            total: order.totalGrossPrice.value,
            subTotal: order.merchandizeTotalPrice.value,
            amount: order.adjustedMerchandizeTotalPrice.value,
            promoCodes: orderPromo.promoCodes,
            discount: orderPromo.orderAdjustmentTotal,
            userCustomerId: order.customerNo,
            customerEmail: order.customerEmail,
            orderCreatedAtUtc: order.creationDate,
            lineItems: getOrderLineItems(order)
        };
        if ('shoppingGivesTrackingId' in order.custom && !empty(order.custom.shoppingGivesTrackingId)) {
            shoppingGiveOrder.trackingId = order.custom.shoppingGivesTrackingId;
        }
        return shoppingGiveOrder;
    } catch (ex) {
        Logger.error('(ShoppingGives~processOrders) -> Error occured while try to generate the request payload for orders and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
}

module.exports = {
    processOrders: processOrders
};
