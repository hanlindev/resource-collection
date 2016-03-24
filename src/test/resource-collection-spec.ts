import * as express from 'express';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {ResourceCollection, PathHelpers, ActionMethod, ResourceAction} from '../resource-collection';
import * as testControllerModule from './helpers/test-controller-module';

describe('ResourceCollection lib', () => {
    let resourceCollection: ResourceCollection<ResourceAction>;
    let pathHelpers: PathHelpers<ResourceAction>;

    beforeEach(() => {
        resourceCollection = new ResourceCollection<ResourceAction>('/api');
        resourceCollection.resource('test', testControllerModule, [
            {
                method: ActionMethod.GET,
                path: '/:id/action/:detail',
                name: 'actionWithDetail'
            }
        ]);
        pathHelpers = new PathHelpers(resourceCollection);
    });

    describe('ResourceCollection', () => {
        describe('toJson', () => {
            it('returns the dummy handler and all endpoints', () => {
                let expected = {
                    globalPathPrefix: '/api',
                    test: {
                        handler: {
                            name: '',
                            show: '',
                            index: '',
                            actionWithDetail: ''
                        },
                        endpoints: {
                            show: {
                                method: 'GET',
                                name: 'show',
                                path: '/:id'
                            },
                            index: {
                                method: 'GET',
                                name: 'index',
                                path: '/'
                            },
                            actionWithDetail: {
                                method: 'GET',
                                name: 'actionWithDetail',
                                path: '/:id/action/:detail'
                            }
                        }
                    }
                };

                expect(resourceCollection.toJson()).to.eql(expected);
            });
        });

        describe('fromJson after registerResourceModule', () => {
            it('returns a ResourceCollection instance', () => {
                let actual = new ResourceCollection<ResourceAction>();
                actual.loadFromJson(resourceCollection.toJson());
                actual.registerResourceModule('test', testControllerModule);
                expect(actual).to.eql(resourceCollection);
            });
        });
    });

    describe('PathHelpers with ResourceCollection', () => {
        describe('pathTo', () => {
            it('returns the path if no argument is accepted', () => {
                expect(pathHelpers.pathTo('test', 'index')).to.equal('/api/test/');
            });

            it('returns the path with a single argument', () => {
                expect(pathHelpers.pathTo('test', 'show', 1)).to.equal('/api/test/1');
            });

            it('returns the path with multiple arguments', () => {
                expect(pathHelpers.pathTo(
                    'test', 'actionWithDetail', [1, 'some_detail']
                )).to.equal('/api/test/1/action/some_detail');
            });

            it('returns the path with get params', () => {
                expect(pathHelpers.pathTo('test', 'show', 1, {
                    param1: 'value1',
                    param2: 'value2'
                })).to.equal('/api/test/1?param1=value1&param2=value2');
            });

            it('throws exception if resource or action is not found', () => {
                expect(() => {pathHelpers.pathTo('not-found', 'resource')}).
                    to.throw();
                expect(() => {pathHelpers.pathTo('test', 'edit', 1)}).to.throw();
            });
        });

        describe('urlTo', () => {
            it('returns the url if url root is specified', () => {
                pathHelpers.urlRoot = 'http://example.com';
                expect(pathHelpers.urlTo(
                    'test', 'show', 1
                )).to.equal('http://example.com/api/test/1');
            });

            it('throws if url root is not specified', () => {
                expect(() => {
                    pathHelpers.urlTo('test', 'show', 1);
                }).to.throw();
            });
        });
    });
})
