<script>
  import { Router, Link, Route, navigate } from 'svelte-routing';
  import Login from './admin/login.svelte';
  import Products from './admin/products.svelte';
  let authorized = false;
  export let url = '';
  export let name='';
  function onAuthorized() {
    authorized = true;
    navigate('/admin/products');
  }
</script>

<Router basepath="admin" url={url}>
  <nav>
  {#if authorized}
    <Link to="products">Products</Link>
  {:else}
    <Link to="/">Login</Link>
  {/if}
  </nav>
  <main>
    <Route path="/"><Login authorized={onAuthorized}/></Route>
    <Route path="products" component="{Products}" />
  </main>
</Router>
<style type="scss">
  @import './admin/css/fonts.scss';
</style>
