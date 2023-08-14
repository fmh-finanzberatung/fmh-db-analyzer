const personTableDef = {
  id: { DATA_TYPE: 'int', IS_NULLABLE: false },
  created_at: { DATA_TYPE: 'timestamp', IS_NULLABLE: false },
  published_at: { DATA_TYPE: 'datetime', IS_NULLABLE: false },
  born_at: { DATA_TYPE: 'date', is_nullable: false },
  active: { DATA_TYPE: 'tinyint', IS_NULLABLE: false },
  name: { DATA_TYPE: 'varchar', IS_NULLABLE: true },
  company_id: { DATA_TYPE: 'int', IS_NULLABLE: true },
};

module.exports = personTableDef;
