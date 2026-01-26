export function logInfo(message: string, meta?: any) {
  console.log(`ℹ️  ${message}`, meta || '');
}

export function logError(message: string, error?: any) {
  console.error(`❌ ${message}`, error || '');
}
