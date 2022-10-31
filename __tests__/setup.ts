import * as core from '@actions/core'
import { beforeAll, jest } from '@jest/globals'
import type { SpyInstance } from 'jest-mock'

type Keys = 'info' | 'warning' | 'error' | 'startGroup' | 'endGroup'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const spyCore: { [key in Keys]?: SpyInstance<any> } = {}

/**
 * Spy and mock functions from '@actions/core'
 * to make sure the console doesn't get polluted
 * and the output won't be interpreted in CI.
 */
export function setup(): void {
  beforeAll(() => {
    spyCore.info = jest.spyOn(core, 'info').mockImplementation(() => {})
    spyCore.warning = jest.spyOn(core, 'warning').mockImplementation(() => {})
    spyCore.error = jest.spyOn(core, 'error').mockImplementation(() => {})
    spyCore.startGroup = jest
      .spyOn(core, 'startGroup')
      .mockImplementation(() => {})
    spyCore.endGroup = jest.spyOn(core, 'endGroup').mockImplementation(() => {})
  })
}
