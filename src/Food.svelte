<script>
import UserInput from './components/UserInput.svelte';
import Accordion from './components/Accordion.svelte';
import Table from './components/Table.svelte';
import pipeline from './pipeline/foodpipeline.js';
import Spinner from './components/Spinner.svelte';

let tableJson = {
    headerList: [],
    tableContentList: [[],[]]
};
let result = '';
let accordionResultJsonList = [];
let searchterm = '';
let selected = '';
let showResultLoader = false;
let placeholderSearchDisplayText = 'Enter a food search term' ;
let dropdownPlaceholderDisplayText = 'Please Select a Food Data Source';
let dropdownOptions = [
  {
    value:'taco',
    displayText: 'Taco Randomizer API'
  },
  {
    value: 'punk',
    displayText: 'Punk API'
  },
  {
    value: 'puppy',
    displayText: 'Recipe Puppy API'
  },
  {
    value: 'foodish',
    displayText: 'Foodish API'
  }
];

async function handleParentUpdate(updateParentEvent) {
	console.log(updateParentEvent);
	const detail = updateParentEvent.detail;
	searchterm = detail.searchQuery;
	selected = detail.selection;
  showResultLoader = true;
  if(selected == 'puppy') {
    tableJson = await pipeline.foodRequestPipelineHandler(selected, searchterm);
  } else {
    accordionResultJsonList = await pipeline.foodRequestPipelineHandler(selected, searchterm);
  }
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
  {#if selected == 'puppy'}
    <Table  tableHeaderList={tableJson.headerList} tableContentList={tableJson.tableContentList}/>
  {:else}
    <Accordion accordionResultJsonList={accordionResultJsonList} />
  {/if}
</div>
<style>

</style>
