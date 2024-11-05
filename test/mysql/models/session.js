import { Model } from 'objection';
import { timestamps } from 'objection-timestamps';

class SessionModel extends timestamps()(Model) {
  static get tableName() {
    return 'sessions';
  }

  static get debug() {
    return true;
  }

  static get hasTimestamps() {
    return true;
  }

  static get sessionKey() {
    return String; // should be uuid
  }
}

return SessionModel;
