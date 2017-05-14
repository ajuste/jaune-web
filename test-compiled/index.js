var create, ok;

create = require('../').create;

ok = require('assert').ok;

describe('create', function() {
  return it('checks create runs', function() {
    return ok(create());
  });
});
