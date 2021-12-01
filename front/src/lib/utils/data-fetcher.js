import axios from 'axios';
import merge from 'webpack-merge';

const DefaultItemOptions = {
  search: {},
  pagination: { page: 1, pageSize: 10 },
  order: {},
};

const DefaultListOptions = merge(DefaultItemOptions, {
  pagination: { page: 1, pageSize: 10 },
});

function fetchQuery(query) {
  return axios({
    url: 'http://localhost:3000/graphql',
    method: 'post',
    data: { query },
  }).then((res) => res.data.data);
}

export default {
  list(options = {}, fn) {
    console.log('list options', options);
    const queryArgs = merge(DefaultListOptions, options);
    const query = fn(queryArgs);
    return fetchQuery(query);
  },
  item(options = {}, fn) {
    const queryArgs = merge(DefaultItemOptions, options);
    const query = fn(queryArgs);
    return fetchQuery(query);
  },
};
