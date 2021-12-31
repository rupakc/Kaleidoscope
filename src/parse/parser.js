var getParsedPunkAPIResponse = function(punkAPIResponse) {
  let parsedResponseJson;
    parsedResponseJson = {
      Name: punkAPIResponse.name,
      Tagline: punkAPIResponse.tagline,
      Description: punkAPIResponse.description,
      FoodPairing: punkAPIResponse.food_pairing.join('|'),
      BrewersTips: punkAPIResponse.brewers_tips
    }
  return parsedResponseJson;
}

var getParsedTacoAPIResponse = function(tacoAPIResponse) {
  let parsedResponseJson = {
    "Mixin": tacoAPIResponse["mixin"]["recipe"],
    "Seasoning": tacoAPIResponse["seasoning"]["recipe"],
    "Base Layer": tacoAPIResponse["base_layer"]["recipe"],
    "Condiment": tacoAPIResponse["condiment"]["recipe"],
    "Shell": tacoAPIResponse["shell"]["recipe"]
  }
  return parsedResponseJson;
}

var getParsedRecipePuppyAPIResponse = function(puppyAPIResponse) {
  let parsedResponseJsonList = puppyAPIResponse["results"];
  return parsedResponseJsonList;
}

var getParsedOwlbotAPIResponse = function(owlbotResponseJson) {
  let definitionList = owlbotResponseJson["definitions"];
  return definitionList;
}

var getParsedOxfordDictionaryAPIResponse = function(oxfordResponseJson) {
  let resultJson = oxfordResponseJson["results"][0];
  let lexicalEntries = resultJson["lexicalEntries"];
  let lexicalCategoryList = [];
  let masterDefinitionList = [];
  let parsedJsonResponseList = [];
  for(let i = 0; i < lexicalEntries.length; i++) {
    lexicalCategoryList.push(lexicalEntries[i].lexicalCategory.text);
    let entries = lexicalEntries[i].entries;
    for(let j = 0; j < entries.length; j++) {
      let senses = entries[j].senses;
      let definitionList = [];
      for(let k = 0; k < senses.length; k++) {
        definitionList.push(senses[k].definitions[0])
      }
      masterDefinitionList.push(definitionList)
    }
  }
  for(let i = 0; i < lexicalCategoryList.length; i++) {
    for(let j = 0; j < masterDefinitionList[i].length; j++) {
      parsedJsonResponseList.push({"Type":lexicalCategoryList[i],
                                  "Definition":masterDefinitionList[i][j]});
    }
  }
  return parsedJsonResponseList;
}

var getParsedPokemonAPIResponse = function(pokemonResponseJson) {
  let abilityReducer = (previousString,newString) => previousString.ability.name + "|" + newString.ability.name;
  let abilitiesString = pokemonResponseJson.abilities.reduce(abilityReducer);
  let typesReducer = (previousJson,currentJson) => previousJson.type.name + "|" + currentJson.type.name;
  let typesString = pokemonResponseJson.types.reduce(typesReducer);
  if (typeof(abilitiesString) === 'object') {
    abilitiesString = abilitiesString.ability.name;
  }
  if (typeof(typesString) === 'object') {
    typesString = typesString.type.name;
  }
  let parsedResponse = {
    "Abilities": abilitiesString,
    "Types": typesString,
    "Height": pokemonResponseJson.height,
    "Weight": pokemonResponseJson.weight
  }
  return parsedResponse;
}

var getParsedRickAndMortyAPIResponse = function(rickAndMortyResponseJson) {
  let resultListJson = rickAndMortyResponseJson["results"];
  let parsedJsonResponseList = [];
  for(let i = 0; i < resultListJson.length; i++) {
    parsedJsonResponseList[i] = {
      "Name": resultListJson[i].name,
      "Status": resultListJson[i].status,
      "Species": resultListJson[i].species,
      "Gender": resultListJson[i].gender,
      "Origin": resultListJson[i].origin.name,
      "Location": resultListJson[i].location.name
    }
  }
  return parsedJsonResponseList;
}

var getParsedGoodReadsAPIResponse = function(goodReadsResponse) {
  let resultListJson = goodReadsResponse.GoodreadsResponse.search.results.work;
  let parsedJsonResponseList = [];
  for(let i = 0; i < resultListJson.length; i++) {
    parsedJsonResponseList[i] = {
        "ratings_count": resultListJson[i]["ratings_count"],
        "text_reviews_count": resultListJson[i]["text_reviews_count"],
        "average_rating": resultListJson[i]["average_rating"],
        "title": resultListJson[i]["best_book"]["title"],
        "author": resultListJson[i]["best_book"]["author"]["name"],
        "image_url": resultListJson[i]["best_book"]["image_url"]
    };
  }
  return parsedJsonResponseList;
}

export default {
  getParsedPunkAPIResponse: getParsedPunkAPIResponse,
  getParsedTacoAPIResponse: getParsedTacoAPIResponse,
  getParsedRecipePuppyAPIResponse: getParsedRecipePuppyAPIResponse,
  getParsedOwlbotAPIResponse: getParsedOwlbotAPIResponse,
  getParsedOxfordDictionaryAPIResponse: getParsedOxfordDictionaryAPIResponse,
  getParsedPokemonAPIResponse: getParsedPokemonAPIResponse,
  getParsedRickAndMortyAPIResponse: getParsedRickAndMortyAPIResponse,
  getParsedGoodReadsAPIResponse: getParsedGoodReadsAPIResponse
}
