const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude the `functions/` directory (Cloud Functions) from Metro bundling.
// Use an *absolute* path match so we don't accidentally ignore packages like `semver/functions/*`.
// On Windows, Metro may see either `\` or `/` separators, so accept both.
// This prevents `firebase-admin` (server-side) from being pulled into the client bundle.
const existingBlockList = config.resolver?.blockList;
const blockListFlags = Array.isArray(existingBlockList)
  ? existingBlockList[0]?.flags ?? ''
  : existingBlockList?.flags ?? '';
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const functionsDir = path.resolve(__dirname, 'functions');
const functionsDirPattern = escapeRegExp(functionsDir).replace(/\\\\/g, '[\\\\/]');
const functionsBlockListRE = new RegExp(`^${functionsDirPattern}(?:[\\\\/].*)?$`, blockListFlags);
config.resolver = {
  ...config.resolver,
  blockList: Array.isArray(existingBlockList)
    ? [...existingBlockList, functionsBlockListRE]
    : existingBlockList
      ? [existingBlockList, functionsBlockListRE]
      : [functionsBlockListRE],
};

module.exports = config;
