export function parseChallengeContent(desc = '') {
  if (!desc) return { explanation: '', example: '' };

  const inputIndex = desc.indexOf('Input:');
  const exampleIndex = desc.indexOf('Example:');
  const targetIndex = inputIndex !== -1 ? inputIndex : exampleIndex;

  if (targetIndex !== -1) {
    return {
      explanation: desc.substring(0, targetIndex).trim(),
      example: desc.substring(targetIndex).trim(),
    };
  }

  return {
    explanation: desc,
    example: 'Refer to standard problem specifications on the platform for detailed inputs/outputs.',
  };
}
