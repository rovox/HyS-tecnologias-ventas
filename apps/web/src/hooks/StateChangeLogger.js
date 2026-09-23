export const logStateChange = async (params) => {
  console.log('[StateChangeLogger] noop:', params?.entityType, params?.estadoAnterior, '->', params?.estadoNuevo);
  return { success: true };
};
