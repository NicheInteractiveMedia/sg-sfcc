'use strict';
var ArrayList = require('dw/util/ArrayList');
var FileWriter = require('dw/io/FileWriter');
var Logger = require('dw/system/Logger').getLogger('ShoppingGives');
var OrderMgr = require('dw/order/OrderMgr');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');

var orders = null;
var orderFileName = null;
var orderFileWriter = null;
var orderRequestGenerator = null;
var ordersToExport = [];

/**
 * Initialize readers and writers for job processing
 * @param {Object} parameters job parameters
 * @param {JobStepExecution} stepExecution job step execution
 */
exports.beforeStep = function (parameters, stepExecution) {
    var shoppingGivesHelper = require('*/cartridge/scripts/helpers/shoppingGivesHelper');
    orderRequestGenerator = require('*/cartridge/scripts/generators/orderRequestGenerator');

    var source = parameters.get('srcFolder');
    orderFileName = shoppingGivesHelper.createOrderFeedFile(source);
    orderFileWriter = new FileWriter(orderFileName);
    var isDelta = true;
    var orderQuery = shoppingGivesHelper.buildOrderQuery(isDelta);
    orders = OrderMgr.searchOrders(orderQuery.query, orderQuery.sortString, orderQuery.queryParams);
};

exports.getTotalCount = function () {
    Logger.info('ShoppingGives-ExportOrders -> Total Orders Found: {0}', orders.count);
    return orders.count;
};

exports.read = function (parameters, stepExecution) { // eslint-disable-line
    if (orders.hasNext()) {
        return orders.next();
    }
};

exports.process = function (order, parameters, stepExecution) {
    Logger.info('ShoppingGives-ExportOrders - Processing Order: {0}', order.orderNo);
    return orderRequestGenerator.processOrders(order);
};

exports.write = function (lines, parameters, stepExecution) {
    var orderChunk = new ArrayList(lines).toArray();
    ordersToExport = ordersToExport.concat(orderChunk);

    Logger.info('ShoppingGives-ExportOrders - Total Orders Exported: {0}', lines.length);
};

exports.afterStep = function () {
    orders = {
        orders: ordersToExport
    };
    orderFileWriter.writeLine(JSON.stringify(orders));
    orderFileWriter.flush();
    orderFileWriter.close();
    Transaction.wrap(function () {
        var lastRunTime = new Date();
        Site.current.preferences.custom.shoppingGivesLastOrderSync = lastRunTime;
    });
    if ((orders && orders.count === 0) || (ordersToExport.length === 0)) {
        orderFileName.remove();
        Logger.info('ShoppingGives-ExportOrders - No Orders Found to Export, empty file has been removed');
    }
};
