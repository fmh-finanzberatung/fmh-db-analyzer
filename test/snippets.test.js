const TableData = {
  persons: {
    // corresponds to pluralized table name
    id: { DATA_TYPE: 'int', IS_NULLABLE: false },
    name: { DATA_TYPE: 'varchar', IS_NULLABLE: true },
    company_id: { DATA_TYPE: 'int', IS_NULLABLE: true },
    job_id: { DATA_TYPE: 'int', IS_NULLABLE: true },
    city: { DATA_TYPE: 'varchar', IS_NULLABLE: true },
  },
  companies: {
    // corresponds to pluralized table name
    id: { DATA_TYPE: 'int', IS_NULLABLE: false },
    legal_name: { DATA_TYPE: 'varchar', IS_NULLABLE: true },
  },
  jobs: {
    // corresponds to pluralized table name
    id: { DATA_TYPE: 'int', IS_NULLABLE: false },
    title: { DATA_TYPE: 'varchar', IS_NULLABLE: true },
    parent_id: { DATA_TYPE: 'int', IS_NULLABLE: true },
  },
};

function createJournal(TableData) {
  const journal = new Map();

  for (let key in TableData) {
    // corresponds to pluralized table name
    const graphNode = new GraphNode(key);
    const fieldData = TableData[key];

    for (let fieldName in fieldData) {
      const rowData = fieldData[fieldName];
      graphNode.addAttribute(fieldName, rowData);
    }
    journal.set(graphNode.capitalizedName(), graphNode);
  }

  return journal;
}

