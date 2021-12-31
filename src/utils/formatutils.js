var getFormattedJsonForAccordion = function(jsonResponse) {
  let jsonKeys = Object.keys(jsonResponse);
  let formattedJsonList = [];
  for(let i = 0; i < jsonKeys.length; i++) {
    formattedJsonList[i] = {
      header: jsonKeys[i],
      content: jsonResponse[jsonKeys[i]]
    }
  }
  return formattedJsonList;
}

var formatJsonResponseForTableUI = function(parsedResponseJsonList) {
  let headerList = [];
  let tableContentList = [];
  var formattedTableJson = {
    'headerList': headerList,
    'tableContentList': tableContentList
  };
  if(parsedResponseJsonList.length > 0) {
      headerList = Object.keys(parsedResponseJsonList[0]);
      for(var i = 0; i < parsedResponseJsonList.length; i++) {
        tableContentList.push(Object.values(parsedResponseJsonList[i]));
      }
      formattedTableJson["headerList"] = headerList;
      formattedTableJson["tableContentList"] = tableContentList;
   }

  return formattedTableJson;

}

var formatFoodishAPIResponseForUI = function(parsedResponse) {
  let imageHTML = "<img src=" + "'" + parsedResponse + "'" + " width='500px'  height='500px'" +">";
  return [{header: "Foodish Image", content: imageHTML}];
}


export default {
  getFormattedJsonForAccordion: getFormattedJsonForAccordion,
  formatJsonResponseForTableUI: formatJsonResponseForTableUI,
  formatFoodishAPIResponseForUI: formatFoodishAPIResponseForUI
}
