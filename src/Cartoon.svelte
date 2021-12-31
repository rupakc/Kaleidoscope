<script>
import UserInput from './components/UserInput.svelte';
import cartoonPipeline from './pipeline/cartoonpipeline.js';
import Table from './components/Table.svelte';
import Spinner from './components/Spinner.svelte';

let tableJson = {
    headerList: [],
    tableContentList: [[],[]]
};
let searchterm = '';
let selected;
let showResultLoader = false;
let placeholderSearchDisplayText = 'Enter a cartoon search term' ;
let dropdownPlaceholderDisplayText = 'Please Select a Cartoon Data Source';
let dropdownOptions = [
  {
    value:'pokemon',
    displayText: 'Pokemon API'
  },
  {
    value: 'ricky',
    displayText: 'Rick & Morty API'
  }
];

async function handleParentUpdate(updateParentEvent) {
	console.log(updateParentEvent);
	const detail = updateParentEvent.detail;
	searchterm = detail.searchQuery;
	selected = detail.selection;
  showResultLoader = true;
  if (selected == "pokemon") {
    tableJson = await cartoonPipeline.getPokemonResponsePipeline(searchterm);
  } else {
    tableJson = await cartoonPipeline.getRickAndMortyResponsePipeline(searchterm);
  }
  console.log(tableJson);
  showResultLoader = false;
}

</script>


<UserInput searchterm={searchterm} selected={selected} dropdownOptions={dropdownOptions}
placeholderSearchDisplayText={placeholderSearchDisplayText} dropdownPlaceholderDisplayText={dropdownPlaceholderDisplayText}
on:updateParent={handleParentUpdate}/>
<br/>
<br/>
<div class="container">
{#if showResultLoader}
  <Spinner />
{/if}
  <Table  tableHeaderList={tableJson.headerList} tableContentList={tableJson.tableContentList}/>
</div>

<style>

</style>
