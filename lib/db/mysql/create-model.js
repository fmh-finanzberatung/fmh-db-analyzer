import { Model } from 'objection';


export default function createModel(modelDef, knex) {
  Model.knex(knex);
  class DbModel extends Model {
    
    static get tableName() {
      return modelDef.tableName;
    }
    
    static addVirtual(name, getter, setter) {
      Object.defineProperty(this.prototype, name, {
        get: getter,
        set: setter,
        enumerable: true,
      });
    }

    $beforeInsert() {
      this.created_at = new Date().toISOString();
      this.updated_at = new Date().toISOString();
    }
    $beforeUpdate() {
      this.updated_at = new Date().toISOString();
    }
    static get jsonSchema() {
      return modelDef.jsonSchema;
    }
    static get relationMappings() {
      return modelDef.relationMappings;
    }
  }

  if (modelDef.virtuals) { 
    Object.keys(modelDef.virtuals).forEach((name) => {
      const virtual = modelDef.virtuals[name];
      DbModel.addVirtual(name, virtual.get, virtual.set);
    }); 
  }

  return DbModel;
}
