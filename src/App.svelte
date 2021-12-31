<script>
	import Navbar from './components/Navbar.svelte';
	import Router from 'svelte-spa-router';
	import routes from './routes';

</script>

<main>

	<Navbar/>
	<Router {routes} />

</main>

<style>

	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
