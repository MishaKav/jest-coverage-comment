import * as core from '@actions/core'
import { jest } from '@jest/globals'

// Spy and mock functions from '@actions/core'
// to make sure the console doesn't get polluted
// and the output won't be interpreted in CI.
export const spyCore = {
  info: jest.spyOn(core, 'info').mockImplementation(() => {}),
  warning: jest.spyOn(core, 'warning').mockImplementation(() => {}),
  error: jest.spyOn(core, 'error').mockImplementation(() => {}),
  startGroup: jest.spyOn(core, 'startGroup').mockImplementation(() => {}),
  endGroup: jest.spyOn(core, 'endGroup').mockImplementation(() => {}),
}
