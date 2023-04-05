'use strict';

var Bytes = require('dw/util/Bytes');
var Calendar = require('dw/util/Calendar');
var Encoding = require('dw/crypto/Encoding');
var File = require('dw/io/File');
var FileReader = require('dw/io/FileReader');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger').getLogger('ShoppingGives');
var Mac = require('dw/crypto/Mac');
var MessageDigest = require('dw/crypto/MessageDigest');
var RandomAccessFileReader = require('dw/io/RandomAccessFileReader');
var StringUtils = require('dw/util/StringUtils');

var shoppingGivesConstant = require('*/cartridge/scripts/util/shoppingGivesConstant');

var signedHeaders = "date;host;x-amz-content-sha256;x-amz-date;x-amz-storage-class";
var httpMethod = 'PUT';
var messageDigest = new MessageDigest(MessageDigest.DIGEST_SHA_256);

/**
 * Returns the hashed form of the payload
 * @param {(string|File)} payload - payload
 * @returns {string} Hex-encoded hash
 */
function getPayloadHash(payload) { // eslint-disable-line
    var payloadHash;
    if (typeof payload === "string") {
        payloadHash = messageDigest.digestBytes(new Bytes(payload));
        return Encoding.toHex(payloadHash);
    } else if (payload instanceof File) {
        var fileReader = new RandomAccessFileReader(payload);
        var currentByte;
        while ((currentByte = fileReader.readBytes(1)) !== null) { // eslint-disable-line
            messageDigest.updateBytes(currentByte);
        }
        fileReader.close();
        return Encoding.toHex(messageDigest.digest());
    }
}

/**
 * Returns the aws formatted canonical headers
 * @param {string} host - host
 * @param {string} payloadHash - payloadHash
 *  @param {string} rawDate - rawDate
 * @param {string} date - date
 * @returns {string} Multi-line String of Canonical headers
 * @todo fix use of private 'constants' as setting variables
 */
function getCanonicalHeaders(host, payloadHash, rawDate, date) {
    var canonicalHeaders =
        'date:' + rawDate.toUTCString() + '\n' +
        'host:' + host + '\n' +
        'x-amz-content-sha256:' + payloadHash + '\n' +
        'x-amz-date:' + date + '\n' +
        // eslint-disable-next-line no-useless-concat
        'x-amz-storage-class:REDUCED_REDUNDANCY' + '\n';
    return canonicalHeaders;
}

/**
 * Returns the aws formatted credential scope
 * @param {string} dateStamp - dateStamp
 * @param {string} awsRegion - awsRegion
 * @param {string} awsService - awsService
 * @returns {string} strng
 */
function getCredentialScope(dateStamp, awsRegion, awsService) {
    return dateStamp + '/' +
        awsRegion + '/' +
        awsService + '/' +
        'aws4_request';
}

/**
 * Calculate hash
 * @param {bytes[]} key private key to sign
 * @param {string} msg String to sign
 * @returns {bytes} Calculated signature
 */
function hash(key, msg) {
    var mac = new Mac(Mac.HMAC_SHA_256);
    var signatureBytes = mac.digest(new Bytes(msg), key);
    return signatureBytes;
}

function hmacHex(key, msg) {
    return Encoding.toHex(hash(key, msg));
}

/**
 * Creates the AWS signing key
 * @param {string} key - key
 * @param {string} dateStamp - dateStamp
 * @param {string} regionName - regionName
 * @param {string} serviceName - serviceName
 * @returns {string} The Signing Key to use for authorization.
 */
function getSignatureKey(key, dateStamp, regionName, serviceName) {
    var signedDate;
    var signedRegion;
    var signedService;
    var signingKey;
    var awsKey = "AWS4" + key;
    signedDate = hash(new Bytes(awsKey), dateStamp);
    signedRegion = hash(signedDate, regionName);
    signedService = hash(signedRegion, serviceName);
    signingKey = hash(signedService, "aws4_request");

    return signingKey;
}

/**
 * Creates the AWS Formatted Date
 * @param {Date} date - date
 * @returns {string} formatted date.
 */
function formattedDate(date) {
    var calendar = new Calendar(date);
    var currentDate = StringUtils.formatCalendar(calendar, "yyyyMMdd");
    return currentDate;
}

/**
 * Returns the aws formatted canonical request
 * @param {string} canonicalURI - canonicalURI
 * @param {string} canonicalQueryString - canonicalQueryString
 * @param {string} canonicalHeaders - canonicalHeaders
 * @param {string} payloadHash - payloadHash
 * @returns {string} Multi-line HTTP request headers
 */
function getCanonicalRequest(canonicalURI, canonicalQueryString, canonicalHeaders, payloadHash) {
    var canonicalRequest = httpMethod + '\n' +
        canonicalURI + '\n' +
        canonicalQueryString + '\n' +
        canonicalHeaders + '\n' +
        signedHeaders + '\n' +
        payloadHash;
    return canonicalRequest;
}
/**
 * Create the string to sign
 * @param {string} algorithm - algorithm
 * @param {string} dateTimeStamp - dateTimeStamp
 * @param {string} credentialScope - credentialScope
 * @param {string} canonicalRequest - canonicalRequest
 * @returns {string} String
 */
function getStringToSign(algorithm, dateTimeStamp, credentialScope, canonicalRequest) {
    return algorithm + '\n' +
        dateTimeStamp + '\n' +
        credentialScope + '\n' +
        Encoding.toHex(messageDigest.digestBytes(new Bytes(canonicalRequest)));
}

/**
 * Create the authorization header
 * @param {string} algorithm - algorithm
 * @param {string} accessKeyId - accessKeyId
 * @param {string} credentialScope - credentialScope
 * @param {string} signature - signature
 * @returns {string} authorization header
 */
function getAuthorizationHeader(algorithm, accessKeyId, credentialScope, signature) {
    var authorizationHeader = algorithm + ' ' +
        'Credential=' + accessKeyId + '/' + credentialScope + ',' +
        'SignedHeaders=' + signedHeaders + ',' +
        'Signature=' + signature;

    return authorizationHeader;
}


function getShoppingGivesService(args) {
    var serviceConfig = {
        createRequest: function (svc, file) {
            var currentDate = new Date();
            var timestamp = currentDate.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/[:-]/g, '');
            var date = formattedDate(currentDate);

            var accessKeyId = shoppingGivesConstant.SHG_CONSTANTS.SHG_ACCESS_KEY_ID;
            var secretKey = shoppingGivesConstant.SHG_CONSTANTS.SHG_SECRET_KEY;
            var bucket = shoppingGivesConstant.SHG_CONSTANTS.SHG_BUCKET;
            var s3Region = shoppingGivesConstant.SHG_CONSTANTS.SHG_REGION;
            var storeId = shoppingGivesConstant.SHG_CONSTANTS.SHG_STORE_ID;
            var algorithm = shoppingGivesConstant.SHG_CONSTANTS.SHG_ALGORITHM;
            var s3Service = shoppingGivesConstant.SHG_CONSTANTS.SHG_SERVICE_S3;

            var fileReader = new FileReader(file);
            var fileContent = fileReader.getString();
            fileReader.close();

            var baseUrl = svc.URL + File.SEPARATOR + bucket + File.SEPARATOR + storeId + File.SEPARATOR + args.remotePath + file.getName();
            var host = svc.URL.replace('https://', '');
            var relativePath = File.SEPARATOR + bucket + File.SEPARATOR + storeId + File.SEPARATOR + args.remotePath + file.getName();
            svc.URL = baseUrl;
            var credentialScope = getCredentialScope(date, s3Region, s3Service);
            var payLoadHash = getPayloadHash(file);
            var canonicalHeaders = getCanonicalHeaders(host, payLoadHash, currentDate, timestamp);
            var canonicalRequest = getCanonicalRequest(relativePath, '', canonicalHeaders, payLoadHash);
            var stringToSign = getStringToSign(algorithm, timestamp, credentialScope, canonicalRequest);
            var signedKey = getSignatureKey(secretKey, date, s3Region, s3Service);

            var signature = hmacHex(signedKey, stringToSign); // should be equal to 98ad721746da40c64f1a55b78f14c238d841ea1380cd77a1b5971af0ece108bd
            var authorizationHeader = getAuthorizationHeader(algorithm, accessKeyId, credentialScope, signature);

            svc.setAuthentication('NONE');
            svc.setRequestMethod(httpMethod);
            svc.addHeader('x-amz-content-sha256', payLoadHash);
            svc.addHeader('x-amz-date', timestamp);
            svc.addHeader('host', host);
            svc.addHeader('x-amz-storage-class', shoppingGivesConstant.SHG_CONSTANTS.SHG_AWS_STORAGE_HEADER);
            svc.addHeader('Date', currentDate.toUTCString());
            svc.addHeader('Authorization', authorizationHeader);

            return fileContent;
        },
        parseResponse: function (svc, client) {
            return client.text;
        },
        filterLogMessage: function (message) {
            return message;
        },
        getRequestLogMessage: function (serviceRequest) {
            return serviceRequest;
        },
        getResponseLogMessage: function (serviceResponse) {
            if (!empty(serviceResponse) && !empty(serviceResponse.errorText)) {
                Logger.error('Error occurred while calling AWS REST API {0}: {1} ({2})', serviceResponse.statusCode, serviceResponse.statusMessage, serviceResponse.errorText);
                return serviceResponse.errorText;
            }
            return serviceResponse.text;
        }
    };
    return serviceConfig;
}

exports.getAWSService = function (args) {
    return LocalServiceRegistry.createService(shoppingGivesConstant.SHG_SERVICE.S3BUCKET, getShoppingGivesService(args));
};
