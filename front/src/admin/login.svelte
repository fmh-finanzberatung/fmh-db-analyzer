<script>
  import ExtLabel from '../form/ext-label.svelte';
  export let authorized = () => {};
  const credentials = {
    name: '',
    password: '',
  };
  function submit() {
     authorized(true);
  }
</script>

<form action="">
  <ext-label label="Name">
    <input type="text" bind:value={credentials.name} />
  </ext-label>
  <ext-label label="Passwort">
    <input type="password" bind:value={credentials.name} />
  </ext-label>
  <button type="submit" on:click|preventDefault={submit}> Login </button>
</form>

<style type="scss">
  @import './css/fonts.scss';
  @import './css/colors.scss';
  
  input { 
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.25em;
    font-size: 1rem;
    display: block; 
  }
</style>
