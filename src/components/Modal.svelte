<script>
  export let modalId = "aboutmodal";
  export let modalHeader = 'Kaleidoscope : A Mish-Mash of APIs for Fun';
  export let modalText = 'An Application Built Purely for Fun using <b> Svelte JS </b>'
  + 'and Materlize CSS. It is truly a serverless architecture because everything is done at the client end (i.e. in browser).'
  + 'Starting from making REST API calls to parsing the data the full stack functionality is embedded on the client side.';
</script>

<div id={modalId} class="modal modal-fixed-footer">
  <div class="modal-content">
    <h4>{modalHeader}</h4>
    <img class="responsive-img" height="700px" src="/kaleidoscope.png">
    <p>{@html modalText}</p>
  </div>
  <div class="modal-footer">
    <a href="#!" class="modal-close waves-effect waves-green btn-flat">Close</a>
  </div>
</div>

<style>
.modal-content p {
  font-size: 18px;
}
</style>
