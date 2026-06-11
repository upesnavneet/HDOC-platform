// @ts-check
/**
 * M2: Centralized logger — suppresses all console output in production.
 * In development: passes through to real console methods.
 * In production: no-op functions (zero output, zero data leakage).
 *
 * Usage: import { log, warn, error } from '../utils/logger';
 */

const isDev = import.meta.env.DEV;

/** @type {typeof console.log} */
export const log = isDev ? console.log.bind(console) : () => {};

/** @type {typeof console.warn} */
export const warn = isDev ? console.warn.bind(console) : () => {};

/** @type {typeof console.error} */
export const error = isDev ? console.error.bind(console) : () => {};
