<script>
export let cardJsonList = [{
author: "George R.R. Martin",
image_url: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1562726234l/13496._SY160_.jpg",
ratings_count: "2016836",
text_reviews_count: "54718",
title: "A Game of Thrones (A Song of Ice and Fire, #1)"
},
{
author: "George R.R. Martin",
image_url: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1562726234l/13496._SY160_.jpg",
ratings_count: "2016836",
text_reviews_count: "54718",
title: "A Game of Thrones (A Song of Ice and Fire, #1)"
},
{
author: "George R.R. Martin",
image_url: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1562726234l/13496._SY160_.jpg",
ratings_count: "2016836",
text_reviews_count: "54718",
title: "A Game of Thrones (A Song of Ice and Fire, #1)"
},
{
author: "George R.R. Martin",
image_url: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1562726234l/13496._SY160_.jpg",
ratings_count: "2016836",
text_reviews_count: "54718",
title: "A Game of Thrones (A Song of Ice and Fire, #1)"
}];
function truncate(input) {
   if (input.length > 5) {
      return input.substring(0, 5) + '...';
   }
   return input;
};
</script>
{#each cardJsonList as cardJson}
  <div class="card">
      <div class="card-image waves-effect waves-block waves-light">
        <img class="activator" src={cardJson.image_url}  alt="Image">
      </div>
      <div class="card-content">
        <span class="card-title activator grey-text text-darken-4">{cardJson.title}<i class="material-icons right">more_vert</i></span>
      </div>
      <div class="card-reveal">
        <span class="card-title grey-text text-darken-4">{cardJson.author}<i class="material-icons right">close</i></span>
        <div class="card-action">
          <div class="chip" style="margin-top:50px">
            # Ratings: {cardJson.ratings_count}
          </div>
          <div class="chip">
            # Reviews: {cardJson.text_reviews_count}
          </div>
          <div class="chip">
            Average Rating: {cardJson.average_rating}
          </div>
        </div>
      </div>
  </div>
{/each}

<style>
  .card {
    display:inline-block;
    margin-right:10px;

  }
  .card .card-title {
    font-size:16px;

  }
  .card .card-image img {
    height:200px;
    width:50%;
    left:30%;
    margin-top:10px;
  }
</style>
