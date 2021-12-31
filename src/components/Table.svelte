<script>
export let tableJson = {
    headerList:[],
    tableContentList:[[],[],[]]

}
export let tableHeaderList = [];
export let tableContentList=[];
</script>

<table class="striped">
  <thead>
    <tr>
      {#each tableHeaderList as tableHeader}
        <th>{tableHeader}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each tableContentList as tableRowList }
      <tr>
          {#each tableRowList as tableRowData}
            <td> {tableRowData} </td>
          {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>

</style>
