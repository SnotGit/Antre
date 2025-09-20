export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET || 'lantre-dev-secret-2025';
  
  // Log d'avertissement en développement
  if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  JWT_SECRET manquant - utilisation fallback développement');
  }
  
  return secret;
};