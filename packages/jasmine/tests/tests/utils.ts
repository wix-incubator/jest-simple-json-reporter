import createFolderStrucutre, { FolderStructure } from 'create-folder-structure'

export const jasmineSimpleJsonReporterPath = require.resolve('jasmine-simple-json-reporter')
export const jasmineModulePath = require.resolve('jasmine')
export const jasmineReporterModulePath = require.resolve('jasmine-console-reporter')

export const generateProject = (files: FolderStructure) =>
  createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: `node jasmine.js`,
        },
      },
      ...files,
    },
  })
