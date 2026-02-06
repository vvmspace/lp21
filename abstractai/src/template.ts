export type TemplateVariables = Record<string, string | number | boolean | null | undefined>;

export const applyTemplate = (input: string, variables: TemplateVariables): string => {
  return input.replace(/%([a-zA-Z0-9_]+)(\|[^%]+)?%/g, (match, key, fallback) => {
    const value = variables[key];
    if (value === null || value === undefined || value === '') {
      if (fallback) {
        return fallback.slice(1);
      }
      return '';
    }
    return String(value);
  });
};
