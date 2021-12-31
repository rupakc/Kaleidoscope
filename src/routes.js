import Cartoon from './Cartoon.svelte';
import Crypto from './Crypto.svelte';
import Food from './Food.svelte';
import Dictionary from './Dictionary.svelte';
import Books from './Books.svelte';

// Export the route definition object

export default {
  // Exact path
  
    '/': Food,
    '/cartoon': Cartoon,
    '/food': Food,
    '/dictionary': Dictionary,
    '/books': Books
}
