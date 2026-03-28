export const DOMAIN_COLORS: Record<string, string> = {
  'Distinction':          '#d4845a',
  'Composition':          '#4a9890',
  'Self-reference':       '#c0a048',
  'Economic':             '#5c9a72',
  'Topological':          '#6878b8',
  'Biological':           '#a89040',
  'Cybernetic':           '#4898a8',
  'Thermodynamic':        '#b85858',
  'Game-Theoretic':       '#8868b0',
  'Linguistic':           '#b06888',
  'Sociological':         '#4a9890',
  'Information-Theoretic':'#c07840',
  'Material-Science':     '#707888',
  'Temporal':             '#9860b0',
  'Cognitive':            '#5098b0',
  'Legal-Regulatory':     '#a07070',
  'Ethical':              '#608a70',
  'Computational':        '#a89848',
}

export const DOMAIN_SHORT: Record<string, string> = {
  'Distinction': 'D', 'Composition': 'C', 'Self-reference': 'S',
  'Economic': 'ECON', 'Topological': 'TOPO', 'Biological': 'BIO',
  'Cybernetic': 'CYB', 'Thermodynamic': 'THERM', 'Game-Theoretic': 'GAME',
  'Linguistic': 'LING', 'Sociological': 'SOC', 'Information-Theoretic': 'INFO',
  'Material-Science': 'MAT', 'Temporal': 'TEMP', 'Cognitive': 'COG',
  'Legal-Regulatory': 'LAW', 'Ethical': 'ETH', 'Computational': 'COMP',
}

export function getColor(domain: string): string {
  return DOMAIN_COLORS[domain] || '#d4845a'
}

export function getShort(domain: string): string {
  return DOMAIN_SHORT[domain] || domain?.slice(0, 4)?.toUpperCase() || '?'
}
