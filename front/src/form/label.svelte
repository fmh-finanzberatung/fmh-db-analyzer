<script>
  export let fieldError;
  export let label;
</script>

<template>
  <label class="label">
    <span class="label__text">{label}</span>
    <slot />
    {#if fieldError}
      <span class="label__error">{fieldError}</span>
    {/if}
  </label>
</template>

<style type="scss">
  @import '../admin/css/fonts.scss';
  @import '../admin/css/colors.scss';

  .label {
    font-family: $primary-font__family;
    display: block;
    margin-bottom: 0.5rem;
  }
  .label__text {
    font-family: $primary-font__family;
    display: block;
    font-size: 0.8rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .label__error {
    font-family: $primary-font__family;
    color: red;
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
  }
</style>
