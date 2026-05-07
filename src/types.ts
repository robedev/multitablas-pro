/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Session {
  id: string;
  date: string;
  tables: number[];
  score: number;
  total: number;
  errors: ErrorRecord[];
  duration: number; // in seconds
}

export interface ErrorRecord {
  factorA: number;
  factorB: number;
  userAnswer: number;
  correctAnswer: number;
  timestamp: string;
}

export interface TableMastery {
  table: number;
  correct: number;
  attempts: number;
  lastPracticed: string;
}

export type AppMode = 'HOME' | 'SELECT_TABLES' | 'LEARN' | 'QUIZ' | 'HISTORY' | 'PROGRESS' | 'RESULTS';
