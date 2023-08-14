<script>
  export let cssStyle = '';
  export let name = '';
  export let sortableFields;
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function dispatchChange(ev) {
    console.log('ev            ', ev);
    console.log('sortableFields', sortableFields);


    const changedOrder = sortableFields[name] === 'ASC' ? 'DESC' : 'ASC';
    // insert or put first changedOrder in sortableFields object
    console.log('changedOrder', changedOrder);
    console.log('on name     ', name);
    const changedFields = Object.assign(
      {}, 
      sortableFields,
      {[name]: changedOrder},
    );

    console.log('changedFields', changedFields);

    dispatch('change', changedFields);
  }
</script>

<th class={cssStyle}>
  <button class="button" on:click|preventDefault={dispatchChange}>
    <slot></slot>
  </button>
</th>

<style lang="scss">
</style>
