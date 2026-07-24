/**
 * Mock of @ontomorph/dtp-sdk (Digital Twin Platform).
 * Creates a twin and computes its organ-level state from flagged
 * interactions. In production the SDK also streams the 3D anatomy mesh;
 * here the <AnatomyModel/> component renders a stylised stand-in driven by
 * the same organ-risk map this returns.
 */
import { computeOrganRisk, computeOverall } from './engine.js'

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

let counter = 1000

export const dtpSdkMock = {
  /** Create a twin record for a student. */
  async createTwin({ name, profile }) {
    await delay(250)
    counter += 1
    return {
      twinId: `twin_${counter}`,
      name: name || 'My Twin',
      profile: profile || {},
      createdAt: 'demo', // Date.* avoided for deterministic demo builds
    }
  },

  /**
   * Compute twin state (per-organ risk + overall) from interaction flags.
   * The anatomy renderer consumes `organRisk`.
   */
  async getTwinState({ twinId, flags }) {
    await delay(300)
    return {
      twinId,
      organRisk: computeOrganRisk(flags),
      overall: computeOverall(flags),
      flagCount: flags.length,
    }
  },
}
