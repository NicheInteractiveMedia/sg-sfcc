'use strict';

var ArrayList = require('dw/util/ArrayList');
var FileWriter = require('dw/io/FileWriter');
var Logger = require('dw/system/Logger').getLogger('ShoppingGives');

var products = null;
var productFileName = null;
var productFileWriter = null;
var productRequestGenerator = null;
var shoppingGivesHelper = null;
var shoppingGivesConstant = null;
var productsToExport = [];

/**
 * Initialize readers and writers for job processing
 * @param {Object} parameters job parameters
 * @param {JobStepExecution} stepExecution job step execution
 */
exports.beforeStep = function (parameters, stepExecution) {
    shoppingGivesConstant = require('*/cartridge/scripts/util/shoppingGivesConstant');
    shoppingGivesHelper = require('*/cartridge/scripts/helpers/shoppingGivesHelper');
    productRequestGenerator = require('*/cartridge/scripts/generators/productRequestGenerator');
    var source = parameters.get('srcFolder');
    productFileName = shoppingGivesHelper.createProductFeedFile(source);
    productFileWriter = new FileWriter(productFileName);
    var isDelta = false;
    products = shoppingGivesHelper.buildProductQuery(isDelta);
};

exports.read = function (parameters, stepExecution) { // eslint-disable-line
    if (products.hasNext()) {
        return products.next();
    }
};

exports.process = function (product, parameters, stepExecution) {
    Logger.info('exportProducts-process - Processing product: {0}', product.ID);
    return productRequestGenerator.processProducts(product);
};

exports.write = function (lines, parameters, stepExecution) {
    var productChunk = new ArrayList(lines).toArray();
    productsToExport = productsToExport.concat(productChunk);
    Logger.info('exportProducts-write - Total products Exported: {0}', productsToExport.length);
};

exports.afterStep = function () {
    var product = {
        storeId: shoppingGivesConstant.SHG_CONSTANTS.SHG_STORE_ID,
        fullSync: true,
        timestamp: shoppingGivesHelper.getFormattedDate(),
        upsertProducts: productsToExport
    };
    productFileWriter.writeLine(JSON.stringify(product));
    productFileWriter.flush();
    productFileWriter.close();
    if (productsToExport && productsToExport.length === 0) {
        productFileName.remove();
        Logger.info('exportProductsDelta-write - No products Found to Export, empty file has been removed');
    }
};
