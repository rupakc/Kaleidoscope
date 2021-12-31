import request from '../utils/requestutils.js';
import parser from '../parse/parser.js';
import formatutils from '../utils/formatutils.js';
import constants from '../config/constants.js';

var getPunkAPIParsedResultPipeline = async function(uri=constants.PUNK_API_URI) {
  let response = await request.getResponseFromURL(uri);
  let result = response[0];
  let parsedResult = parser.getParsedPunkAPIResponse(result);
  let accordionResultJsonList = formatutils.getFormattedJsonForAccordion(parsedResult);
  return accordionResultJsonList;
}

var getTacoAPIParsedResultPipeline = async function(uri=constants.TACO_API_URI) {
  let response = await request.getResponseFromURL(uri);
  let parsedTacoResponse = parser.getParsedTacoAPIResponse(response);
  let accordionResultJsonList = formatutils.getFormattedJsonForAccordion(parsedTacoResponse);
  return accordionResultJsonList;
}

var getRecipePuppyAPIParsedResultPipeline = async function(searchQuery, uri=constants.RECIPE_PUPPY_URI) {
  let response = await request.getResponseFromURL(uri,{q:searchQuery});
  let parsedJsonResponseList = parser.getParsedRecipePuppyAPIResponse(response);
  let tableJson = formatutils.formatJsonResponseForTableUI(parsedJsonResponseList);
  return tableJson;
}

var getFoodishAPIParsedResultPipeline = async function(searchQuery, uri=constants.FOODISH_API_URI) {
  let response = await request.getResponseFromURL(uri);
  let parsedJson = response["image"];
  let foodishResponse = formatutils.formatFoodishAPIResponseForUI(parsedJson);
  return foodishResponse;
}

var foodRequestPipelineHandler = async function(foodAPIKey,searchTerm='') {
  let accordionResultJsonList=[]
  if(foodAPIKey.toLowerCase() == 'taco') {
    accordionResultJsonList = await getTacoAPIParsedResultPipeline();
  } else if(foodAPIKey.toLowerCase() == 'puppy') {
    accordionResultJsonList = await getRecipePuppyAPIParsedResultPipeline(searchTerm);
  } else if (foodAPIKey.toLowerCase() == 'foodish') {
    accordionResultJsonList = await getFoodishAPIParsedResultPipeline(searchTerm);
  } else {
    accordionResultJsonList = await getPunkAPIParsedResultPipeline();
  }
  return accordionResultJsonList;
}

export default {
  getPunkAPIParsedResultPipeline: getPunkAPIParsedResultPipeline,
  getTacoAPIParsedResultPipeline: getTacoAPIParsedResultPipeline,
  getRecipePuppyAPIParsedResultPipeline: getRecipePuppyAPIParsedResultPipeline,
  getFoodishAPIParsedResultPipeline: getFoodishAPIParsedResultPipeline,
  foodRequestPipelineHandler: foodRequestPipelineHandler
}
