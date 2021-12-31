<script>
import UserInput from './components/UserInput.svelte';
import dictionarypipeline from './pipeline/dictionarypipeline.js';
import Table from './components/Table.svelte';
import Spinner from './components/Spinner.svelte';

let tableJson = {
    headerList: [],
    tableContentList: [[],[]]
};

let searchterm = '';
let selected;
let showResultLoader = false;
let placeholderSearchDisplayText = 'Enter a dictionary search term' ;
let dropdownPlaceholderDisplayText = 'Please Select a Dictionary Data Source';
let dropdownOptions = [
  {
    value:'oxford',
    displayText: 'Oxford Dictionary API'
  },
  {
    value: 'owlbot',
    displayText: 'Owl Bot API'
  }
];

async function handleParentUpdate(updateParentEvent) {
	console.log(updateParentEvent);
	const detail = updateParentEvent.detail;
	searchterm = detail.searchQuery;
	selected = detail.selection;
  showResultLoader = true;
  if(selected == 'owlbot') {
    tableJson = await dictionarypipeline.owlbotAPIResponsePipeline(searchterm);
  } else {
    tableJson = await dictionarypipeline.oxfordDictionaryResponsePipeline(searchterm);
  }
  showResultLoader = false;
}

</script>

<UserInput searchterm={searchterm} selected={selected} dropdownOptions={dropdownOptions}
placeholderSearchDisplayText={placeholderSearchDisplayText}
dropdownPlaceholderDisplayText={dropdownPlaceholderDisplayText}
on:updateParent={handleParentUpdate}/>
<div class="container">
{#if showResultLoader}
  <Spinner />
{/if}
  <Table  tableHeaderList={tableJson.headerList} tableContentList={tableJson.tableContentList}/>
</div>

<style>

</style>
