<script>
import UserInput from './components/UserInput.svelte';
import Spinner from './components/Spinner.svelte';

let searchterm = '';
let selected;
let placeholderSearchDisplayText = 'Enter a crypto search term' ;
let dropdownPlaceholderDisplayText = 'Please Select a Crypto Data Source';
let dropdownOptions = [
  {
    value:'coinpaprika',
    displayText: 'Coin Paprika API'
  },
  {
    value: 'coingeek',
    displayText: 'Coin Geek API'
  },
  {
    value: 'coindesk',
    displayText: 'Coin Desk API'
  },
];

function handleParentUpdate(updateParentEvent) {
	console.log(updateParentEvent);
	const detail = updateParentEvent.detail;
	searchterm = detail.searchQuery;
	selected = detail.selection;
}

</script>


<UserInput searchterm={searchterm} selected={selected} dropdownOptions={dropdownOptions}
placeholderSearchDisplayText={placeholderSearchDisplayText}
dropdownPlaceholderDisplayText={dropdownPlaceholderDisplayText}
on:updateParent={handleParentUpdate}/>
{#if showResultLoader}
  <Spinner />
{/if}
<style>

</style>
