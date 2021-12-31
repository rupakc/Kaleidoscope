import request from '../utils/requestutils.js';
import keys from '../config/keys.js';
import constants from '../config/constants.js';
import parser from '../parse/parser.js';
import formatutils from '../utils/formatutils.js';

var owlbotAPIResponsePipeline = async function(searchTerm) {
    if (searchTerm == '') {
      searchTerm = 'bank';
    }
    let headerJson = {'Authorization': 'Token '+ keys.OWLBOT_API_TOKEN};
    let uri = constants.OWLBOT_API_URI + searchTerm;
    let response = await request.getResponseFromURL(uri,{},headerJson);
    let parsedDefinitionList = parser.getParsedOwlbotAPIResponse(response);
    let formattedTableJson = formatutils.formatJsonResponseForTableUI(parsedDefinitionList);
    return formattedTableJson;
  }

var oxfordDictionaryResponsePipeline = async function(searchTerm) {
  if (searchTerm == '') {
    searchTerm = 'bank';
  }
  let headerJson = {
    "Accept": "application/json",
    "app_id": keys.OXFORD_DICTIONARY_APP_ID,
    "app_key": keys.OXFORD_DICTIONARY_APP_KEY
  };
  let queryParamsJson = {"fields":"definitions","strictMatch":false}
  let uri = constants.OXFORD_API_URI + searchTerm;
  let response = await request.getResponseFromURL(uri, queryParamsJson, headerJson);
  let parsedResponseJsonList = parser.getParsedOxfordDictionaryAPIResponse(response);
  let formattedTableJson = formatutils.formatJsonResponseForTableUI(parsedResponseJsonList);
  return formattedTableJson;
}
export default {
  owlbotAPIResponsePipeline: owlbotAPIResponsePipeline,
  oxfordDictionaryResponsePipeline: oxfordDictionaryResponsePipeline
}
