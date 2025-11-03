function createUnifiedDiff(original, updated, { language } = {}) {
  const originalLines = (original || '').split(/\r?\n/);
  const updatedLines = (updated || '').split(/\r?\n/);
  const max = Math.max(originalLines.length, updatedLines.length);

  const diffLines = [
    `--- original.${language || 'txt'}`,
    `+++ updated.${language || 'txt'}`
  ];

  let changes = 0;

  for (let index = 0; index < max; index += 1) {
    const before = originalLines[index];
    const after = updatedLines[index];

    if (before === after) {
      if (before !== undefined) {
        diffLines.push(` ${before}`);
      }
      continue;
    }

    if (before !== undefined) {
      diffLines.push(`-${before}`);
      changes += 1;
    }
    if (after !== undefined) {
      diffLines.push(`+${after}`);
      changes += 1;
    }
  }

  return {
    diff: diffLines.join('\n'),
    changes
  };
}

module.exports = {
  createUnifiedDiff
};
