<script>

export let accordionResultJsonList = [];

document.addEventListener('click', function() {
    var elems = document.querySelectorAll('.collapsible');
    var instances = M.Collapsible.init(elems, {});
  });
</script>

<ul class="collapsible popout">
  {#each accordionResultJsonList as accordionJson }
    <li>
      <div class="collapsible-header"><i class="material-icons">whatshot</i>{accordionJson.header}</div>
      <div class="collapsible-body"><span>{@html accordionJson.content}</span></div>
    </li>
  {/each}
</ul>

<style>

</style>
