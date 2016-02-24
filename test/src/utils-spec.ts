import {expect} from 'chai';
import * as utils from '../../src/utils';

describe('fillString', () => {
    it('replaces :<param> with arguments', () => {
        const template = '/resource/:id/action';
        const expected = '/resource/1/action';
        expect(utils.fillString(template, {id: 1})).to.equal(expected);
    });

    it('should not replace params with no argumet', () => {
        const template = '/resource/:id/action/:no_replace';
        const expected = '/resource/1/action/:no_replace';
        expect(utils.fillString(template, {id: 1})).to.equal(expected);
    });
});

describe('getStringParams', () => {
    it('should get all names beginning with colons', () => {
        const template = '/resource/:id/action/:sub';
        const expected = ['id', 'sub'];
        expect(utils.getStringParams(template)).to.eql(expected);
    });

    it('should return empty array if no param', () => {
        const template = '/resource';
        const expected = [];
        expect(utils.getStringParams(template)).to.eql(expected);
    });
});
