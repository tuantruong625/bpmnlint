import NodeResolver from '../../../lib/resolver/node-resolver';

import {
  expect
} from '../../helper';


describe('resolver/node-resolver', function() {

  describe('#resolveRule', function() {

    const resolver = createResolver(function(path) {

      if (path === 'not/rules/found') {
        throw new Error('not found');
      }

      // mock node resolution
      if (path === 'bpmnlint') {
        throw new Error('not found');
      }

      if (path === 'bpmnlint/rules/local-fallback') {
        throw new Error('not found');
      }

      return {
        path
      };
    });


    it('should resolve built-in', async function() {

      // when
      const resolvedRule = await resolver.resolveRule('bpmnlint', 'label-required');

      // then
      expect(resolvedRule).to.eql({
        path: 'bpmnlint/rules/label-required'
      });
    });


    it('should resolve external', async function() {

      // when
      const resolvedRule = await resolver.resolveRule('foo', 'label-required');

      // then
      expect(resolvedRule).to.eql({
        path: 'foo/rules/label-required'
      });
    });


    it('should fail to resolve external', async function() {

      let err;

      // when
      try {
        await resolver.resolveRule('not', 'found');
      } catch (e) {
        // then
        expect(e.message).to.eql('not found');

        err = e;
      }

      // verify
      expect(err).to.exist;
    });


    it('should resolve built-in rule relative', async function() {

      // when
      const resolvedRule = await resolver.resolveRule('bpmnlint', 'local-fallback');

      // then
      expect(resolvedRule).to.eql({
        path: '../../rules/local-fallback'
      });
    });

  });


  describe('#resolveConfig', function() {

    const resolver = createResolver(function(path) {

      // mock node resolution
      if (path.indexOf('bpmnlint/') === 0) {
        throw new Error('not found');
      }

      // mimic $PKG/config/$NAME resolution
      if (path === 'bpmnlint-plugin-foo/config/bar') {
        return {
          path,
          bar: true
        };
      }

      if (path.startsWith('bpmnlint-plugin-foo/config')) {
        throw new Error('not found');
      }


      if (path.indexOf('config') !== -1) {
        return {
          path
        };
      }

      // mimic $PKG.configs[$NAME] resolution
      if (path === 'bpmnlint-plugin-foo') {
        return {
          configs: {
            embedded: {
              path,
              embedded: true
            }
          }
        };
      }

      throw new Error('unexpected path <' + path + '>');
    });


    describe('should resolve built-in', function() {

      it('all', async function() {

        // when
        const resolvedConfig = await resolver.resolveConfig('bpmnlint', 'all');

        // then
        expect(resolvedConfig).to.eql({
          path: '../../config/all'
        });
      });


      it('recommended', async function() {

        // when
        const resolvedConfig = await resolver.resolveConfig('bpmnlint', 'recommended');

        // then
        expect(resolvedConfig).to.eql({
          path: '../../config/recommended'
        });
      });

    });


    describe('should resolve external', function() {

      it('via $PKG/config/$NAME', async function() {

        // when
        const resolvedConfig = await resolver.resolveConfig('bpmnlint-plugin-foo', 'bar');

        // then
        expect(resolvedConfig).to.eql({
          path: 'bpmnlint-plugin-foo/config/bar',
          bar: true
        });

      });


      it('via $PKG.configs[$NAME]', async function() {

        // when
        const resolvedConfig = await resolver.resolveConfig('bpmnlint-plugin-foo', 'embedded');

        // then
        expect(resolvedConfig).to.eql({
          path: 'bpmnlint-plugin-foo',
          embedded: true
        });

      });

    });


    it('should fail to resolve external', async function() {

      let err;

      // when
      try {
        await resolver.resolveConfig('bpmnlint-plugin-foo', 'non-existing');
      } catch (e) {
        expect(e.message).to.eql(
          'cannot resolve config <non-existing> in <bpmnlint-plugin-foo>'
        );

        err = e;
      }

      // verify
      expect(err).to.exist;
    });

  });

});


// helpers /////////////////////////////

function createResolver(requireFn) {
  return new NodeResolver({
    require: requireFn
  });
}