<script>
  export let location;
  import PageManager from '../components/page-manager.svelte';
  import ThSort from '../components/th-sort.svelte';
  import DataFetcher from '../lib/utils/data-fetcher.js';
  import buildQueryArgs from '../lib/utils/build-query-args.js';
  import { onMount } from 'svelte';
  let list = [];
  let pagination = {};
  let sortableFields = {
    name: 'ASC',
    price: 'DESC',
  };

  async function loadData(args) {
    console.log('loadData', args);
    try {
      const data = await DataFetcher.list(args, (normalizedArgs) => {
        console.log('normalizedArgs', normalizedArgs);
        return `{
          products ${buildQueryArgs(normalizedArgs)}  {
            docs {
              id
              name
              subtitle
              price
              description
            }
            pagination {
              total
              pages
              pageSize          
              page
            }
          }
        }`;
      });

      list = [];
      for (let i = 0, l = data.products.docs.length; i < l; i++) {
        list = [...list, data.products.docs[i]];
      }

      for (let key in data.products.pagination) {
        pagination[key] = data.products.pagination[key];
      }
    } catch (err) {
      console.error(err);
    }
  }

  onMount(async () => {
    await loadData({ pagination: { page: 1 },  order: sortableFields });
  });
</script>

<template>
  <PageManager
    page={pagination.page}
    page-size={pagination.pageSize}
    total={pagination.total}
    pages={pagination.pages}
    on:change={(ev) => loadData({ pagination: ev.detail })}
  >
    <label for="search" slot="search" class="label">
      <input
        on:input={(e) => {
          loadData({ search: { name: `"${e.target.value}*"` } });
        }}
        type="search"
        id="serch"
        value=""
        class="text-field"
        list="search-datalist"
        placeholder="Suche"
      />
    </label>

    <table>
      <thead>
        <tr>
          <ThSort
            name="name"
            sortableFields={sortableFields}
            on:change={(ev) => { 
              console.log('ev.detail', ev.detail);
              sortableFields = Object.assign(sortableFields , ev.detail);
              console.log('sortableFields', sortableFields);
              return loadData( { order: sortableFields }) ;}}
            cssStyle="th">Name</ThSort
        >
          <th>Untertitel</th>
          <ThSort
            name="price"
            sortableFields={sortableFields}
            on:change={(ev) => { 
              console.log('ev.detail', ev.detail);
              sortableFields = Object.assign(sortableFields , ev.detail);
              console.log('sortableFields', sortableFields);
              return loadData( { order: sortableFields }) ;}}
            cssStyle="th">Preis</ThSort
          >
        </tr>
      </thead>
      {#each list as item}
        <tr>
          <td class="td">{item.name}</td>
          <td class="td">{item.subtitle}</td>
          <td class="td">{item.price}</td>
          <td class="td">edit</td>
          <td class="td">delete</td>
        </tr>
      {/each}
      <tbody>
        <tr>
          <td class="td" />
        </tr>
      </tbody>
    </table>
  </PageManager>
</template>

<style type="text/scss">
  @import './css/fonts.scss';
</style>
