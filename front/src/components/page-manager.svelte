<script>
  import { createEventDispatcher } from 'svelte';
  const PageSizes = [10, 25, 50, 100, 250, 500];
  export let page = 1;
  export let total = 0;
  export let pages = 0;
  export let pageSize = 10;
  const dispatch = createEventDispatcher();

  function dispatchChange(changedItem) {
    dispatch('change', Object.assign({ pageSize, page },
      changedItem));
  }

  const onPageSizeChange = (ev) => {
    const pageSize = parseInt(ev.target.value); 
    dispatchChange({pageSize, page: 1});
    return pageSize;
  };

  const onPageChange = (val) => {
    if (page < 1 || page > pages) {
      return page;
    }
    dispatchChange({page: val});
    return val;
  };
</script>

<template>
  <div class="page-manager">
    <nav class="page-manager__paginator">
      <button
        class="button page-manager__nav-item"
        on:click|preventDefault={onPageChange(1)}
      >
        |&lt; </button
      >
      <button
        class="button page-manager__nav-item"
        on:click|preventDefault={onPageChange(page - 1)}
      >
        &lt;</button
      >
      <div class="page-manager__of">
        {page} von {pages} ({total} Einträge)
      </div>
      <div class="page-manager__paginator">
        <select bind:value={pageSize} on:change={onPageSizeChange}
          class="select">
          {#each PageSizes as pageSize}
            <option value={pageSize}>{pageSize}</option>
          {/each}
        </select>
      </div>
      <button
        href="/#"
        class="button page-manager__nav-item"
        on:click|preventDefault={onPageChange(page + 1)}
      >
        &gt;</button
      >
      <button
        href="/#"
        class="button page-manager__nav-item"
        on:click|preventDefault={onPageChange(pages)}
      >
      &gt;|</button
      >
    </nav>
    <slot name="search" />
    <slot />
  </div>
</template>

<style type="text/scss">
  .page-manager {
    &__paginator {
      display: flex;
      flex-flow: row;
      justify-content: space-between;
      align-items: center;
      justify-content: center;
    }
    &__nav-item {
      width: 18%;
    } 
  } 
</style>
