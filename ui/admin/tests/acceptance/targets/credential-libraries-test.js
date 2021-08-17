import { module, test } from 'qunit';
import { visit, find, findAll, click, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';
import { Response } from 'miragejs';
import a11yAudit from 'ember-a11y-testing/test-support/audit';
import {
  authenticateSession,
  // These are left here intentionally for future reference.
  //currentSession,
  //invalidateSession,
} from 'ember-simple-auth/test-support';

module('Acceptance | targets | credential-libraries', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  let getCredentialLibraryCount;

  const instances = {
    scopes: {
      global: null,
      org: null,
      project: null,
    },
    credentialStore: null,
    credentialLibraries: null,
    credentialLibrary: null,
  };
  const urls = {
    globalScope: null,
    orgScope: null,
    projectScope: null,
    targets: null,
    target: null,
    credentialLibraries: null,
    credentialLibrary: null,
    addCredentialLibraries: null,
  };

  hooks.beforeEach(function () {
    // Generate resources
    instances.scopes.global = this.server.create('scope', { id: 'global' });
    instances.scopes.org = this.server.create('scope', {
      type: 'org',
      scope: { id: 'global', type: 'global' },
    });
    instances.scopes.project = this.server.create('scope', {
      type: 'project',
      scope: { id: instances.scopes.org.id, type: 'org' },
    });
    instances.credentialStore = this.server.create('credential-store', {
      type: 'vault',
      scope: instances.scopes.project,
    });
    instances.credentialLibraries = this.server.createList(
      'credential-library',
      2,
      {
        scope: instances.scopes.project,
        credentialStore: instances.credentialStore,
      }
    );
    instances.credentialLibrary = instances.credentialLibraries[0];
    instances.target = this.server.create('target', {
      scope: instances.scopes.project,
      credentialLibraries: instances.credentialLibraries,
    });
    // Generate route URLs for resources
    urls.globalScope = `/scopes/global/scopes`;
    urls.orgScope = `/scopes/${instances.scopes.org.id}/scopes`;
    urls.projectScope = `/scopes/${instances.scopes.project.id}`;
    urls.targets = `${urls.projectScope}/targets`;
    urls.target = `${urls.targets}/${instances.target.id}`;
    urls.credentialLibraries = `${urls.target}/credential-libraries`;
    urls.credentialLibrary = `${urls.projectScope}/credential-stores/${instances.credentialLibrary.credentialStoreId}/credential-libraries/${instances.credentialLibrary.id}`;
    urls.addCredentialLibraries = `${urls.target}/add-credential-libraries`;
    // Generate resource counter
    getCredentialLibraryCount = () =>
      this.server.schema.credentialLibraries.all().models.length;
    authenticateSession({});
  });

  test('visiting target credential libraries', async function (assert) {
    assert.expect(2);
    await visit(urls.credentialLibraries);
    await a11yAudit();
    assert.equal(currentURL(), urls.credentialLibraries);
    assert.equal(findAll('tbody tr').length, getCredentialLibraryCount());
  });

  test('can navigate to a credential library', async function (assert) {
    assert.expect(1);
    await visit(urls.credentialLibraries);
    await click('main tbody .rose-table-header-cell:nth-child(1) a');
    await a11yAudit();
    assert.equal(currentURL(), urls.credentialLibrary);
  });

  test('visiting add credential libraries', async function (assert) {
    assert.expect(1);
    await visit(urls.addCredentialLibraries);
    await a11yAudit();
    assert.equal(currentURL(), urls.addCredentialLibraries);
  });

  test('can select and save credential libraries to add', async function (assert) {
    assert.expect(4);
    instances.target.update({ credentialLibraries: [] });
    await visit(urls.credentialLibraries);
    assert.equal(findAll('tbody tr').length, 0);
    await visit(urls.addCredentialLibraries);
    assert.equal(findAll('tbody tr').length, getCredentialLibraryCount());
    await click('tbody label');
    await click('form [type="submit"]');
    assert.equal(currentURL(), urls.credentialLibraries);
    assert.equal(findAll('tbody tr').length, 1);
  });

  test('can select and cancel credential libraries to add', async function (assert) {
    assert.expect(4);
    instances.target.update({ credentialLibraries: [] });
    await visit(urls.credentialLibraries);
    assert.equal(findAll('tbody tr').length, 0);
    await visit(urls.addCredentialLibraries);
    assert.equal(findAll('tbody tr').length, getCredentialLibraryCount());
    await click('tbody label');
    await click('form [type="button"]');
    assert.equal(currentURL(), urls.credentialLibraries);
    assert.equal(findAll('tbody tr').length, 0);
  });

  test('adding credential libraries which errors displays error message', async function (assert) {
    assert.expect(1);
    this.server.post('/targets/:idMethod', () => {
      return new Response(
        400,
        {},
        {
          status: 400,
          code: 'invalid_argument',
          message: 'The request was invalid.',
          details: {},
        }
      );
    });
    instances.target.update({ credentialLibraries: [] });
    await visit(urls.addCredentialLibraries);
    await click('tbody label');
    await click('form [type="submit"]');
    assert.ok(find('[role="alert"]'));
  });

  test('can remove a credential library', async function (assert) {
    assert.expect(2);
    const count = getCredentialLibraryCount();
    await visit(urls.credentialLibraries);
    assert.equal(findAll('tbody tr').length, count);
    await click('tbody tr .rose-dropdown-button-danger');
    assert.equal(findAll('tbody tr').length, count - 1);
  });

  test('removing a target credential library which errors displays error messages', async function (assert) {
    assert.expect(2);
    this.server.post('/targets/:idMethod', () => {
      return new Response(
        400,
        {},
        {
          status: 400,
          code: 'invalid_argument',
          message: 'The request was invalid.',
          details: {},
        }
      );
    });
    const count = getCredentialLibraryCount();
    await visit(urls.credentialLibraries);
    assert.equal(findAll('tbody tr').length, count);
    await click('tbody tr .rose-dropdown-button-danger');
    assert.ok(find('[role="alert"]'));
  });
});