'use strict';

var ArrayList = require('dw/util/ArrayList');
var Logger = require('dw/system/Logger').getLogger('ShoppingGives');
var ObjectAttributeDefinition = require('dw/object/ObjectAttributeDefinition');
var URLUtils = require('dw/web/URLUtils');

var shoppingGivesConstant = require('*/cartridge/scripts/util/shoppingGivesConstant');

/**
 * This function returns product variant
 * @param {Object} product - product
 * @returns {Array} - array
 */
function getProductVariants(product) {
    try {
        var variants = [];
        var productVariants = product.variants && product.variants.length > 0 ? product.variants.iterator() : null;
        if (productVariants) {
            var variant = null;
            var productImage = null;
            while (productVariants.hasNext()) {
                variant = productVariants.next();
                productImage = variant.getImage('large');
                variants.push({
                    cmsId: variant.ID,
                    sku: variant.ID,
                    name: variant.name,
                    description: variant.shortDescription ? variant.shortDescription.source : '',
                    images: productImage && productImage.httpsURL ? productImage.httpsURL.toString() : '',
                    basePrice: variant.priceModel.price.value
                });
            }
        }
        return {
            variants: variants
        };
    } catch (ex) {
        Logger.error('(productRequestGenerator-getProductvariants) -> Error occured while generating Product variants and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
    return null;
}
/**
 * @param {Object} product - product
 * @param {string} type - type
 * @param {Object} collectionsAttribute - CollectionsAttribute
 * @returns {Array} - array
 */
function getCollections(product, type, collectionsAttribute) {
    var collections = [];
    try {
        switch (collectionsAttribute.attributeTypeCode) {
            case ObjectAttributeDefinition.VALUE_TYPE_QUANTITY:
            case ObjectAttributeDefinition.VALUE_TYPE_STRING:
            case ObjectAttributeDefinition.VALUE_TYPE_BOOLEAN:
            case ObjectAttributeDefinition.VALUE_TYPE_TEXT:
            case ObjectAttributeDefinition.VALUE_TYPE_NUMBER:
            case ObjectAttributeDefinition.VALUE_TYPE_INT:
                if (collectionsAttribute.attributeValue && type === shoppingGivesConstant.SHG_CONSTANTS.SHG_ASSOCIATED_GROUP) {
                    collections.push({
                        cmsId: collectionsAttribute.attributeValue,
                        name: collectionsAttribute.attributeValue,
                        description: ''
                    });
                } else if (collectionsAttribute.attributeValue && type === shoppingGivesConstant.SHG_CONSTANTS.SHG_TAGS) {
                    collections.push(collectionsAttribute.attributeValue);
                }
                break;
            case ObjectAttributeDefinition.VALUE_TYPE_ENUM_OF_STRING:
            case ObjectAttributeDefinition.VALUE_TYPE_ENUM_OF_INT:
                var attributeValue = new ArrayList(collectionsAttribute.attributeValue).toArray();
                if (attributeValue && attributeValue.length && attributeValue.length > 0) {
                    attributeValue.forEach(item => {
                        if (type === shoppingGivesConstant.SHG_CONSTANTS.SHG_ASSOCIATED_GROUP) {
                            collections.push({
                                cmsId: item.value,
                                name: item.value,
                                description: ''
                            });
                        } else if (type === shoppingGivesConstant.SHG_CONSTANTS.SHG_TAGS) {
                            collections.push(item.value);
                        }
                    });
                }
                break;
            case ObjectAttributeDefinition.VALUE_TYPE_SET_OF_NUMBER:
            case ObjectAttributeDefinition.VALUE_TYPE_SET_OF_STRING:
            case ObjectAttributeDefinition.VALUE_TYPE_SET_OF_INT:
                if (collectionsAttribute.attributeValue.length > 0) {
                    var collectionsAttributeValue = new ArrayList(collectionsAttribute.attributeValue).toArray();
                    collectionsAttributeValue.forEach(function (status, index) {
                        if (type === shoppingGivesConstant.SHG_CONSTANTS.SHG_ASSOCIATED_GROUP) {
                            collections.push({
                                cmsId: collectionsAttribute.attributeValue[index],
                                name: collectionsAttribute.attributeValue[index],
                                description: ''
                            });
                        } else if (type === shoppingGivesConstant.SHG_CONSTANTS.SHG_TAGS) {
                            collections.push(collectionsAttribute.attributeValue[index]);
                        }
                    });
                }
                break;
            default:
                break;
        }
    } catch (ex) {
        Logger.error('(productRequestGenerator-getCollections) -> attributeTypeCode is not found and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
    return collections;
}

/**
 * @param {Object} product - product
 * @param {sting} attributeId - attributeId
 * @param {string} type - type of attributeId
 * @returns {Array} - array
 */

function getCollectionsAttribute(product, attributeId, type) {
    try {
        var attributeModel = product.getAttributeModel();
        var attributeDefinition = attributeModel.getAttributeDefinition(attributeId);
        var attributeTypeCode = attributeDefinition.valueTypeCode;
        var attributeValue = null;
        try {
            if (attributeDefinition.system) {
                attributeValue = product[attributeId];
            } else {
                attributeValue = product.custom[attributeId];
            }
        } catch (ex) {
            Logger.error('(productRequestGenerator-getCollectionsAttribute) -> AttributeId is not system or custom Product Attribute and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
            return [];
        }
        var collectionsAttribute = {
            attributeValue: attributeValue,
            attributeTypeCode: attributeTypeCode,
            attributeDefinition: attributeDefinition
        };
        return getCollections(product, type, collectionsAttribute);
    } catch (ex) {
        Logger.error('(productRequestGenerator-getCollectionsAttribute) -> AttributeId is not found and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
    return null;
}

/**
 * get product object to be exported
 * @param {Object} product - product
 * @returns {Object} - product object
 */
function processProducts(product) { // eslint-disable-line
    try {
        var productImage;
        var productURI;
        var associatedGroups = getCollectionsAttribute(product, shoppingGivesConstant.SHG_CONSTANTS.SHG_ASSOCIATED_GROUP_ID, shoppingGivesConstant.SHG_CONSTANTS.SHG_ASSOCIATED_GROUP);
        var tags = getCollectionsAttribute(product, shoppingGivesConstant.SHG_CONSTANTS.SHG_TAGS_ID, shoppingGivesConstant.SHG_CONSTANTS.SHG_TAGS);
        var variant = getProductVariants(product);
        productImage = product.getImage('large');
        productURI = URLUtils.abs('Product-Show', 'pid', product.ID).toString();
        return {
            cmsId: product.ID,
            sku: product.ID,
            name: product.name,
            description: product.shortDescription ? product.shortDescription.source : '',
            images: productImage && productImage.httpsURL ? productImage.httpsURL.toString() : '',
            basePrice: product.priceModel.price.value,
            associatedGroups: associatedGroups,
            tags: tags,
            subItems: variant.variants,
            productUri: productURI
        };
    } catch (ex) {
        Logger.error('(productRequestGenerator-processProducts) -> Error occured while processing products and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
}

module.exports = {
    processProducts: processProducts
};
