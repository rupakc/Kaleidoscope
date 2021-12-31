import request from '../utils/requestutils.js';
import keys from '../config/keys.js';
import constants from '../config/constants.js';
import parser from '../parse/parser.js';
import formatutils from '../utils/formatutils.js';


var getPokemonResponsePipeline = async function(searchTerm) {
  let defaultPokemonSearchTerm = 'pikachu';
  if (searchTerm == '') {
    searchTerm = defaultPokemonSearchTerm;
  }
  let uri = constants.POKEMON_API_URI + searchTerm;
  let response = await request.getResponseFromURL(uri);
  let parsedResponse = parser.getParsedPokemonAPIResponse(response);
  let formattedResponse = formatutils.formatJsonResponseForTableUI([parsedResponse]);
  return formattedResponse;
}

var getRickAndMortyResponsePipeline = async function(searchTerm) {
  let defaultRickAndMortySearchTerm = 'morty';
  if (searchTerm == '') {
    searchTerm = defaultRickAndMortySearchTerm;
  }
  let uri = constants.RICK_AND_MORTY_API_URI;
  let queryParamsJson = {"name":searchTerm};
  let response = await request.getResponseFromURL(uri,queryParamsJson);
  let parsedResponseJsonList = parser.getParsedRickAndMortyAPIResponse(response);
  let formattedTableJson = formatutils.formatJsonResponseForTableUI(parsedResponseJsonList);
  return formattedTableJson;
}
export default {
  getPokemonResponsePipeline: getPokemonResponsePipeline,
  getRickAndMortyResponsePipeline: getRickAndMortyResponsePipeline
}
