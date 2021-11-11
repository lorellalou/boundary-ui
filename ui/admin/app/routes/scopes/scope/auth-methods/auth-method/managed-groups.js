import Route from '@ember/routing/route';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import loading from 'ember-loading/decorator';
import { confirm } from 'core/decorators/confirm';
import { notifySuccess, notifyError } from 'core/decorators/notify';

export default class ScopesScopeAuthMethodsAuthMethodManagedGroupsRoute extends Route {
  // =services

  @service intl;
  @service notify;
  @service can;

  //=methods

  /**
   *
   * @returns {Promise{[ManagedGroupsModel]}}
   */
  model() {
    const authMethod = this.modelFor('scopes.scope.auth-methods.auth-method');
    const { id: auth_method_id } = authMethod;
    return this.store.query('managed-group', { auth_method_id });
  }

  // =actions
  /**
   * Rollback changes on a managed group.
   * @param {ManagedGroupModel} managedGroup
   */
  @action
  cancel(managedGroup) {
    const { isNew } = managedGroup;
    managedGroup.rollbackAttributes();
    if (isNew) {
      this.transitionTo('scopes.scope.auth-methods.auth-method.managed-groups');
    }
  }

  /**
   * Save a managed group in current scope.
   * @param {ManagedGroupModel} managedGroup
   */
  @action
  @loading
  @notifyError(({ message }) => message)
  @notifySuccess(({ isNew }) =>
    isNew ? 'notifications.create-success' : 'notifications.save-success'
  )
  async save(managedGroup) {
    await managedGroup.save();
    await this.transitionTo(
      'scopes.scope.auth-methods.auth-method.managed-groups'
    );
    this.refresh();
  }

  /**
   * Delete a managed group in current scope and redirect to index
   * @param {ManagedGroupModel} managed group
   */
  @action
  @loading
  @confirm('questions.delete-confirm')
  @notifyError(({ message }) => message, { catch: true })
  @notifySuccess('notifications.delete-success')
  async deleteManagedGroup(managedGroup) {
    await managedGroup.destroyRecord();
    await this.replaceWith(
      'scopes.scope.auth-methods.auth-method.managed-groups'
    );
    this.refresh();
  }
}