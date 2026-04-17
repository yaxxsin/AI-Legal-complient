/**
 * Feature Manifest Template
 * 
 * Setiap phase/feature WAJIB punya manifest.ts di root folder-nya.
 * File ini di-auto-discover oleh lib/discovery.ts (Phase 0).
 * 
 * JANGAN import manifest dari feature lain.
 * JANGAN edit manifest feature lain.
 * 
 * Copy file ini ke: features/[feature-name]/manifest.ts
 */

import type { FeatureManifest } from '@/types/engine';

const manifest: FeatureManifest = {
  // Unique feature identifier (kebab-case)
  id: 'feature-name',

  // Display name for navigation/UI
  name: 'Feature Name',

  // Icon name (from icon library yang dipakai)
  icon: 'Box',

  // Route path
  path: '/feature-name',

  // Phase number this feature belongs to
  phase: 1,

  // Feature status
  status: 'active', // 'active' | 'planned' | 'deprecated'

  // Navigation config
  nav: {
    show: true,           // Show in sidebar?
    group: 'main',        // Nav group: 'main' | 'admin' | 'settings'
    order: 10,            // Sort order (lower = higher)
  },

  // Dependencies (phase numbers that MUST be complete first)
  dependsOn: [],

  // Database tables this feature CREATES (for conflict detection)
  dbCreates: ['feature_table'],

  // Database tables this feature READS (not owned)
  dbReads: ['users'],
};

export default manifest;


/**
 * Type definition — taruh di types/engine.ts (Phase 0)
 */
/*
export interface FeatureManifest {
  id: string;
  name: string;
  icon: string;
  path: string;
  phase: number;
  status: 'active' | 'planned' | 'deprecated';
  nav: {
    show: boolean;
    group: 'main' | 'admin' | 'settings';
    order: number;
  };
  dependsOn: number[];
  dbCreates: string[];
  dbReads: string[];
}
*/
