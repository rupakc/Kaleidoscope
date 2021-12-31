<script>
export let searchterm;
export let selected;
export let dropdownOptions=[];
export let placeholderSearchDisplayText = 'Enter a search term' ;
export let dropdownPlaceholderDisplayText = 'Please Select a Data Source';
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

function updateOptions(event) {
  dispatch('updateParent', {
      searchQuery: searchterm,
      selection:selected
  });
  console.log(searchterm,selected);
}

function keyPressHandler(event) {
  if(event !== 'undefined') {
    if(event.keyCode == 13) {
      console.log("Enter Pressed");
      updateOptions();
    }
  }
}

</script>


  <div class="row">
      <div class="input-field col s6 offset-s3">
        <div>
          <input on:keypress={keyPressHandler} bind:value={searchterm} placeholder={placeholderSearchDisplayText} type="text" class="validate">
        </div>
      </div>
  </div>
  <div class="row">
    <div class="col s4 offset-s4">
      <select bind:value={selected} class="browser-default">
        <option value="" disabled selected>{dropdownPlaceholderDisplayText}</option>
        {#each dropdownOptions as dropdownJson}
          <option value={dropdownJson.value}>{dropdownJson.displayText}</option>
        {/each}
      </select>
    </div>
  </div>

  <button on:click|preventDefault={updateOptions} class="btn waves-effect waves-light">Search
    <i class="material-icons right">search</i>
  </button>

<style>

</style>
