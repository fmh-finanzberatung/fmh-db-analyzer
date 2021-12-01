<script>
  export let fieldError;
</script>

<template>
  <label class="label">
    <span class="label__text"><slot name="labeltext">No label text</slot></span>
    <slot name="inputfield">No input field</slot>
    <span class="label__error">{fieldError}</span>
  </label>
</template>

<style>
</style>
