import * as _ from 'lodash';

import {fillString, getStringParams, buildQueryString} from './utils';

export type ResourceAction = Function;
// export type ResourceAction = (res: express.Request, req: express.Response) => void;

// ResourceActionType is the type of the request handler. For example, it can
// be the function signature of an ExpressJS request handler.
export interface ResourceModule<ResourceActionType> {
  name: string;
  pathPrefix?: string;
  index?: ResourceActionType;
  new?: ResourceActionType;
  new_?: ResourceActionType; // for ES6 syntax module export
  create?: ResourceActionType;
  show?: ResourceActionType;
  edit?: ResourceActionType;
  update?: ResourceActionType;
  updateByPost?: ResourceActionType;
  destroy?: ResourceActionType;
  delete?: ResourceActionType;
}

export class ActionMethod {
  constructor(public value: string) {}

  static ALL = new ActionMethod('ALL');
  static GET = new ActionMethod('GET');
  static POST = new ActionMethod('POST');
  static PUT = new ActionMethod('PUT');
  static DELETE = new ActionMethod('DELETE');
  static PATCH = new ActionMethod('PATCH');
  static OPTIONS = new ActionMethod('OPTIONS');
  static HEAD = new ActionMethod('HEAD');

  static fromValue(value: string): ActionMethod {
    switch (value) {
      case 'ALL':
      return ActionMethod.ALL;
      case 'GET':
      return ActionMethod.GET;
      case 'POST':
      return ActionMethod.POST;
      case 'PUT':
      return ActionMethod.PUT;
      case 'DELETE':
      return ActionMethod.DELETE;
      case 'PATCH':
      return ActionMethod.PATCH;
      case 'OPTIONS':
      return ActionMethod.OPTIONS;
      case 'HEAD':
      return ActionMethod.HEAD;
      default:
      throw new TypeError(
        `ActionMethod for name - ${value} not found`);
      }
    }
  }

  export interface ResourceEndpoint {
    /**
    * HTTP Method
    * @type {ActionMethod}
    */
    method: ActionMethod;
    /**
    * The HTTP path to the endpoint
    * @type {string}
    */
    path: string;
    /**
    * Name of the action
    * @type {string}
    */
    name: string;
  }

  const defaultEndpoints: ResourceEndpoint[] = [
    {
      method: ActionMethod.GET,
      path: '/',
      name: 'index'
    }, {
      method: ActionMethod.GET,
      path: '/new',
      name: 'new'
    }, {
      method: ActionMethod.GET,
      path: '/new',
      name: 'new_'
    }, {
      method: ActionMethod.POST,
      path: '/',
      name: 'create'
    }, {
      method: ActionMethod.GET,
      path: '/:id',
      name: 'show'
    }, {
      method: ActionMethod.GET,
      path: '/:id/edit',
      name: 'edit'
    }, {
      method: ActionMethod.PUT,
      path: '/:id',
      name: 'update'
    }, {
      method: ActionMethod.POST,
      path: '/:id/update',
      name: 'updateByPost'
    }, {
      method: ActionMethod.GET,
      path: '/:id/destroy',
      name: 'destroy'
    }, {
      method: ActionMethod.DELETE,
      path: '/:id',
      name: 'destroy'
    }
  ];

  export interface Resource<ResourceActionType> {
    handler: ResourceModule<ResourceActionType>;
    endpoints: {[key: string]: ResourceEndpoint};
  }

  export interface SerializedResourceEndpoint {
    /**
    * HTTP Method
    * @type {string}
    */
    method: string;
    /**
    * The HTTP path to the endpoint
    * @type {string}
    */
    path: string;
    /**
    * Name of the action
    * @type {string}
    */
    name: string;
  }

  export interface SerializedResource {
    handler: {[key: string]: string},
    endpoints: {[key: string]: SerializedResourceEndpoint};
  }

  export interface ResourceCollectionJson {
    globalPathPrefix: string;
    paths : {[key: string]: SerializedResource};
  }

  export class ResourceCollection<ResourceActionType> {
    public resources: {[key: string]: Resource<ResourceActionType>} = {};

    constructor(public globalPathPrefix: string = '') {}

    getEndpoint(resource: string, action: string): ResourceEndpoint {
      if (this.hasAction(resource, action)) {
        return this.resources[resource].endpoints[action];
      } else {
        return null;
      }
    }

    /**
    * Add a resource to the ResourceCollection instance.
    * @param  {string}             name           name of the resource.
    * @param  {Resource}           resourceModule the module with action. if you
    *                                             just want the path helpers,
    *                                             you can ignore this parameter.
    *                                             handlers
    * @param  {ResourceEndpoint[]} extra          non-restful endpoints.
    * @return {void}
    */
    resource(
      name: string,
      resourceModule?: ResourceModule<ResourceActionType>,
      extra: ResourceEndpoint[] = []
    ): void {
      let endpoints: {[key: string]: ResourceEndpoint} = {};
      for (let endpoint of [...extra, ...defaultEndpoints]) {
        if (!resourceModule || endpoint.name in resourceModule) {
          endpoints[endpoint.name] = endpoint;
        }
      }

      this.resources[name] = {
        handler: resourceModule,
        endpoints: endpoints
      };
    }

    registerResourceModule(
      name: string,
      resourceModule: ResourceModule<ResourceActionType>
    ) {
      if (name in this.resources) {
        this.resources[name].handler = resourceModule;
      }
    }

    hasAction(
      resourceName: string, actionName: string
    ): boolean {
      if (!(resourceName in this.resources)) {
        return false;
      }

      if (!(actionName in this.resources[resourceName].endpoints)) {
        return false;
      }
      return true;
    }

    toJson(): ResourceCollectionJson {
      let result = {
        globalPathPrefix: this.globalPathPrefix,
        paths: {} as {[key: string]: SerializedResource}
      };
      for (let resourceName in this.resources) {
        let resource = this.resources[resourceName];

        let serialized: SerializedResource = {
          handler: {},
          endpoints: {}
        };

        for (let actionName in resource.handler) {
          if (resource.handler.hasOwnProperty(actionName)) {
            serialized.handler[actionName] = '';
          }
        }

        for (let endpointName in resource.endpoints) {
          let endpoint = resource.endpoints[endpointName];
          serialized.endpoints[endpointName] = {
            name: endpointName,
            method: endpoint.method.value,
            path: endpoint.path
          }
        }
        result.paths[resourceName] = serialized;
      }

      return result;
    }

    /**
    * Restore the endpoints in the serialied ResourceCollection json instance.
    * @param {SerializedResource|string}} json The serialized
    *                                          ResourceCollection instance from
    *                                          toJson method.
    */
    loadFromJson(
      json: ResourceCollectionJson
    ): void {
      this.globalPathPrefix = json.globalPathPrefix;
      for (let resourceName in json.paths) {
        let serialized = json.paths[resourceName];
        let serializedHandler = serialized.handler;
        let serializedEndpoints = serialized.endpoints;

        let extra: ResourceEndpoint[] = [];
        for (let name in serializedEndpoints) {
          if (serializedEndpoints.hasOwnProperty(name)) {
            let endpoint = serializedEndpoints[name];
            extra.push({
              method: ActionMethod.fromValue(endpoint.method),
              name: endpoint.name,
              path: endpoint.path
            });
          }
        }

        let handler: ResourceModule<ResourceActionType> = {
          name: serializedHandler['name']
        };
        for (let name in serializedHandler) {
          if (serializedHandler.hasOwnProperty(name) && name !== 'name') {
            handler[name] = () => {};
          }
        }

        this.resource(resourceName, handler, extra);
      }
    }
  }

  export class PathHelpers<ResourceActionType> {
    constructor(
      public resources: ResourceCollection<ResourceActionType>,
      public urlRoot: string = null
    ) {}

    public regexOf(resource: string): RegExp {
      if (!(resource in this.resources.resources)) {
        throw new TypeError(`Resource - ${resource} not found.`);
      }

      let regexStr = '^';
      if (!!this.resources.globalPathPrefix) {
        regexStr += `${this.resources.globalPathPrefix}\/`;
      }
      regexStr += `${resource}.*`;
      return new RegExp(regexStr);
    }

    /**
    * Return the path to the specified resource action.
    * @param  {string}             resource  The name of the resource.
    * @param  {string}             action    The name of the action.
    * @param  {string|string[]}    args      The arguments to be supplied to
    *                                        the path params. Formatting is
    *                                        done by utils.fillString function.
    * @param  {dict}               getParams The url's get parameters.
    * @return {string}                       The final url.
    */
    public pathTo(
      resource: string,
      action: string,
      args: any|any[] = null,
      getParams: {[key: string]: any} = null
    ): string {
      if (!this.resources.hasAction(resource, action)) {
        throw new TypeError(
          `Action ${action} not found in resource - ${resource}`);
        }

        if (args !== null) {
          args = [].concat(args);
        }

        let endpoint =
          `/${resource}${this.resources.getEndpoint(resource, action).path}`;
        let keys = getStringParams(endpoint);
        if (keys.length > 0) {
          endpoint = fillString(endpoint,_.zipObject(keys, args));
        }

        if (!!this.resources.globalPathPrefix) {
          endpoint = `${this.resources.globalPathPrefix}${endpoint}`;
        }

        if (getParams === null) {
          return endpoint;
        }

        let queryString = buildQueryString(getParams);
        if (!!queryString) {
          endpoint += '?' + queryString;
        }

        return endpoint;
      }

      public genPathTo(
        resource: string,
        action: string
      ) {
        let pathHelpers = this;
        return (
          args: any|any[] = null,
          getParams: {[key: string]: any} = null
        ) => {
          return pathHelpers.pathTo(resource, action, args, getParams);
        }
      }

      public urlTo(
        resource: string,
        action: string,
        args: any|any[] = null,
        getParams: {[key: string]: any} = null
      ): string {
        if (this.urlRoot === null) {
          throw new TypeError('Url root not specified. Unable to form URL');
        }

        let path = this.pathTo(resource, action, args, getParams);
        return this.urlRoot + path;
      }

      public genUrlTo(
        resource: string,
        action: string
      ) {
        let pathHelpers = this;
        return (
          args: any|any[] = null,
          getParams: {[key: string]: any} = null
        ) => {
          return pathHelpers.urlTo(resource, action, args, getParams);
        };
      }
    }
