import Route from '@ember/routing/route';

export default class ScopesScopeAuthMethodsAuthMethodManagedGroupsIndexRoute extends Route {
  setupController(controller) {
    const authMethod = this.modelFor('scopes.scope.auth-methods.auth-method');
    super.setupController(...arguments);
    controller.setProperties({ authMethod });
  }
}