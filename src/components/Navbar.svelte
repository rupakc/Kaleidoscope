<script>
import Modal from './Modal.svelte';

document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.fixed-action-btn');
    var instances = M.FloatingActionButton.init(elems, {
      direction: 'right',
      hoverEnabled: false,
    });

    var tooltipElements = document.querySelectorAll('.tooltipped');
    var tooltipInstances = M.Tooltip.init(tooltipElements, {
      position:'bottom'
    });

    var belems = document.querySelectorAll('.modal');
    var binstances = M.Modal.init(belems, {opacity:0.5});

    var accelems = document.querySelectorAll('.collapsible');
    var accinstances = M.Collapsible.init(accelems, {accordion:true});
  });

</script>

<nav>
  <div class="">
    <div id="test" class="fixed-action-btn click-to-toggle">
      <a class="btn-floating btn-large cyan pulse">
        <i class="large material-icons">menu</i>
      </a>
      <ul class="left">
        <li><a href="#/cartoon" class="btn-floating tooltipped red" data-position="bottom" data-tooltip="Comics & Fun"><i class="material-icons">child_care</i></a></li>
        <li><a href="#/food" class="btn-floating tooltipped yellow darken-1" data-position="bottom" data-tooltip="Food & Drinks"><i class="material-icons">local_dining</i></a></li>
        <li><a href="#/dictionary" class="btn-floating tooltipped green" data-position="bottom" data-tooltip="Dictionary"><i class="material-icons">book</i></a></li>
        <li><a href="#/books" class="btn-floating tooltipped blue" data-position="bottom" data-tooltip="Books"><i class="material-icons">local_library</i></a></li>
        <!-- <li><a href="#" class="btn-floating tooltipped blue" data-position="bottom" data-tooltip="Crypto"><i class="material-icons">euro_symbol</i></a></li> -->
      </ul>
    </div>
    <ul class="right">
      <li style="padding-right:0.5rem">
        <button data-target="aboutmodal" class="btn modal-trigger"> About </button>
      </li>
      <li style="padding-right:0.3rem">
        <a class="btn-floating tooltipped" data-position="bottom" data-tooltip="Github" href="//git.corp.adobe.com/rupachak/Kaleidoscope" target="_blank"><i class="medium material-icons">dialpad</i></a>
      </li>
    </ul>
 </div>
</nav>

<!-- Modal Trigger -->

  <Modal />

<style>
  #test {
      left:2rem;
      right:auto;
      top: 1.3rem;
      bottom:auto;
  }
  nav {
    background-color:#6eb9eee3;

  }
  a {
      text-decoration:none;
   }
</style>
