import axios from 'axios';

var getResponseFromURL = async function(url,queryParamsJson={}, headersJson={}) {
  let response = await axios.get(url,{params: queryParamsJson,headers:headersJson})
  return response.data;
}

export default  {
  getResponseFromURL: getResponseFromURL
}
