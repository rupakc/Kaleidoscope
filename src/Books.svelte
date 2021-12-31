<script>
import UserInput from './components/UserInput.svelte';
import bookpipeline from './pipeline/bookpipeline.js';
import Card from './components/Card.svelte';
import Spinner from './components/Spinner.svelte';

let searchterm = '';
let selected;
let showResultLoader = false;
let placeholderSearchDisplayText = 'Enter a book search term' ;
let dropdownPlaceholderDisplayText = 'Please Select a Book Data Source';
let goodReadsResponseJsonList = [];
let dropdownOptions = [
  {
    value:'goodreads',
    displayText: 'GoodReads API'
  }
];

async function handleParentUpdate(updateParentEvent) {
	console.log(updateParentEvent);
	const detail = updateParentEvent.detail;
	searchterm = detail.searchQuery;
	selected = detail.selection;
  showResultLoader = true;
  goodReadsResponseJsonList = await bookpipeline.goodReadsAPIPipelineResponse(searchterm);
  showResultLoader = false;

}

</script>


<UserInput searchterm={searchterm} selected={selected} dropdownOptions={dropdownOptions}
placeholderSearchDisplayText={placeholderSearchDisplayText}
dropdownPlaceholderDisplayText={dropdownPlaceholderDisplayText}
on:updateParent={handleParentUpdate}/>
<br/>
<br/>
<div class="container">
{#if showResultLoader}
  <Spinner />
{/if}
<Card cardJsonList={goodReadsResponseJsonList}/>
</div>
<style>

</style>
