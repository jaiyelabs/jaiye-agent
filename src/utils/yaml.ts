import yaml from 'js-yaml'

export function parseYaml<T>(content: string): T {
  return yaml.load(content) as T
}

export function dumpYaml(data: unknown): string {
  return yaml.dump(data, { lineWidth: -1, noRefs: true })
}
