import { Tree, VirtualTree } from '@angular-devkit/schematics';
import { createEmptyWorkspace, runSchematic } from '../../utils/testing-utils';
import { readJsonInTree } from '@nrwl/schematics/src/utils/ast-utils';

describe('karmaProject', () => {
  let appTree: Tree;

  beforeEach(async () => {
    appTree = new VirtualTree();
    appTree = createEmptyWorkspace(appTree);
    appTree = await runSchematic(
      'lib',
      {
        name: 'lib1',
        unitTestRunner: 'none'
      },
      appTree
    );
    appTree = await runSchematic(
      'app',
      {
        name: 'app1',
        unitTestRunner: 'none'
      },
      appTree
    );
  });

  it('should generate files', async () => {
    const resultTree = await runSchematic(
      'karma-project',
      {
        project: 'lib1'
      },
      appTree
    );
    expect(resultTree.exists('/libs/lib1/karma.conf.js')).toBeTruthy();
    expect(resultTree.exists('/libs/lib1/tsconfig.spec.json')).toBeTruthy();
  });

  it('should create a karma.conf.js', async () => {
    const resultTree = await runSchematic(
      'karma-project',
      {
        project: 'lib1'
      },
      appTree
    );
    expect(resultTree.readContent('libs/lib1/karma.conf.js'))
      .toBe(`// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

const { join } = require('path');
const getBaseKarmaConfig = require('../../karma.conf');

module.exports = function(config) {
  const baseConfig = getBaseKarmaConfig();
  config.set({
    ...baseConfig,
    coverageIstanbulReporter: {
      ...baseConfig.coverageIstanbulReporter,
      dir: join(__dirname, '../../coverage/libs/lib1')
    }
  });
};
`);
  });

  it('should update the local tsconfig.json', async () => {
    const resultTree = await runSchematic(
      'karma-project',
      {
        project: 'lib1'
      },
      appTree
    );
    const tsConfig = readJsonInTree(resultTree, 'libs/lib1/tsconfig.json');
    expect(tsConfig.compilerOptions.types).toContain('jasmine');
    expect(tsConfig.compilerOptions.types).not.toContain('node');
  });

  describe('library', () => {
    it('should alter angular.json', async () => {
      const resultTree = await runSchematic(
        'karma-project',
        {
          project: 'lib1'
        },
        appTree
      );
      const angularJson = readJsonInTree(resultTree, 'angular.json');
      expect(angularJson.projects.lib1.architect.test).toEqual({
        builder: '@angular-devkit/build-angular:karma',
        options: {
          main: 'libs/lib1/src/test.ts',
          tsConfig: 'libs/lib1/tsconfig.spec.json',
          karmaConfig: 'libs/lib1/karma.conf.js'
        }
      });
      expect(
        angularJson.projects.lib1.architect.lint.options.tsConfig
      ).toContain('libs/lib1/tsconfig.spec.json');
    });

    it('should create a tsconfig.spec.json', async () => {
      const resultTree = await runSchematic(
        'karma-project',
        {
          project: 'lib1'
        },
        appTree
      );
      const tsConfig = readJsonInTree(
        resultTree,
        'libs/lib1/tsconfig.spec.json'
      );
      expect(tsConfig).toEqual({
        extends: './tsconfig.json',
        compilerOptions: {
          outDir: '../../dist/out-tsc/libs/lib1',
          types: ['jasmine', 'node']
        },
        files: ['src/test.ts'],
        include: ['**/*.spec.ts', '**/*.d.ts']
      });
    });

    it('should create test.ts', async () => {
      const resultTree = await runSchematic(
        'karma-project',
        {
          project: 'lib1'
        },
        appTree
      );
      const testTs = resultTree.read('libs/lib1/src/test.ts').toString();
      expect(testTs).toContain("import 'core-js/es7/reflect';");
      expect(testTs).toContain("import 'zone.js/dist/zone';");
    });
  });

  describe('applications', () => {
    it('should alter angular.json', async () => {
      const resultTree = await runSchematic(
        'karma-project',
        {
          project: 'app1'
        },
        appTree
      );
      const angularJson = readJsonInTree(resultTree, 'angular.json');
      expect(angularJson.projects.app1.architect.test).toEqual({
        builder: '@angular-devkit/build-angular:karma',
        options: {
          main: 'apps/app1/src/test.ts',
          polyfills: 'apps/app1/src/polyfills.ts',
          tsConfig: 'apps/app1/tsconfig.spec.json',
          karmaConfig: 'apps/app1/karma.conf.js',
          styles: [],
          scripts: [],
          assets: []
        }
      });
      expect(
        angularJson.projects.app1.architect.lint.options.tsConfig
      ).toContain('apps/app1/tsconfig.spec.json');
    });

    it('should create a tsconfig.spec.json', async () => {
      const resultTree = await runSchematic(
        'karma-project',
        {
          project: 'app1'
        },
        appTree
      );
      const tsConfig = readJsonInTree(
        resultTree,
        'apps/app1/tsconfig.spec.json'
      );
      expect(tsConfig).toEqual({
        extends: './tsconfig.json',
        compilerOptions: {
          outDir: '../../dist/out-tsc/apps/app1/',
          types: ['jasmine', 'node']
        },
        files: ['src/test.ts', 'src/polyfills.ts'],
        include: ['**/*.spec.ts', '**/*.d.ts']
      });
    });

    it('should create test.ts', async () => {
      const resultTree = await runSchematic(
        'karma-project',
        {
          project: 'app1'
        },
        appTree
      );
      const testTs = resultTree.read('apps/app1/src/test.ts').toString();
      expect(testTs).not.toContain("import 'core-js/es7/reflect';");
      expect(testTs).not.toContain("import 'zone.js/dist/zone';");
    });
  });
});
