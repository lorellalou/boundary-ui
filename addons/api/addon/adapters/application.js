import RESTAdapter from '@ember-data/adapter/rest';
import config from 'ember-get-config';
import { get } from '@ember/object';
import { dasherize } from '@ember/string';
import { pluralize } from 'ember-inflector';

export default class ApplicationAdapter extends RESTAdapter {
  // =attributes

  /**
   * Sets host to the `api.host` string in the application's config,
   * if set.
   * @type {string}
   */
  host = get(config, 'api.host');

  /**
   * Sets namespace to the `api.namespace` string in the application's config,
   * if set.
   * @type {string}
   */
  namespace = get(config, 'api.namespace');

  // =methods

  /**
   * Transforms the type to a dasherized string used in our API paths.
   *
   * @override
   * @param {string} type
   * @return {string}
   */
  pathForType(type) {
    return dasherize(pluralize(type));
  }

  /**
   * Overrides default ajax method by rewritting PUT requests as PATCH.
   * PATCH is the request method used by our API for updates.
   *
   * @override
   * @method ajax
   * @private
   * @param {String} url
   * @param {String} type The request type GET, POST, PUT, DELETE etc.
   * @param {Object} options
   * @return {Promise} promise
   */
  ajax(url, type, options) {
    const method = type === 'PUT' ? 'PATCH' : type;
    return super.ajax(url, method, options);
  }
}
