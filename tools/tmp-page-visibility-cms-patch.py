from __future__ import annotations

from pathlib import Path
import subprocess

PAGES = Path('.pages.yml')
WORKFLOW = Path('.github/workflows/ui-responsive.yml')
SELF = Path(__file__)

component = '''  page-visibility-sections:
    type: object
    label: Секции и блоки
    required: true
    list:
      collapsible:
        collapsed: true
        summary: "{id}"
    description: Меняйте только переключатели видимости. Технические ID используются кодом и доступны только для чтения.
    fields:
      - name: id
        label: Технический ID секции
        type: string
        required: true
        readonly: true
      - name: visible
        label: Показывать секцию
        type: boolean
        required: true
      - name: blocks
        label: Блоки
        type: object
        required: true
        list:
          collapsible:
            collapsed: true
            summary: "{id}"
        fields:
          - name: id
            label: Технический ID блока
            type: string
            required: true
            readonly: true
          - name: visible
            label: Показывать блок
            type: boolean
            required: true
'''

group = '''  - name: page-visibility
    label: Видимость секций и блоков
    type: group
    items:
      - name: jestei-pool-visibility
        label: Jestei Pool
        type: file
        path: src/content/visibility/jestei-pool.json
        format: json
        operations:
          create: false
          rename: false
          delete: false
        commit:
          templates:
            update: "content(cms): update page visibility {path}"
        fields:
          - name: sections
            component: page-visibility-sections

      - name: styx-visibility
        label: Styx Jewel
        type: file
        path: src/content/visibility/styx.json
        format: json
        operations:
          create: false
          rename: false
          delete: false
        commit:
          templates:
            update: "content(cms): update page visibility {path}"
        fields:
          - name: sections
            component: page-visibility-sections

      - name: sensetique-visibility
        label: Sensetique
        type: file
        path: src/content/visibility/sensetique.json
        format: json
        operations:
          create: false
          rename: false
          delete: false
        commit:
          templates:
            update: "content(cms): update page visibility {path}"
        fields:
          - name: sections
            component: page-visibility-sections

      - name: shootings-visibility
        label: Shootings
        type: file
        path: src/content/visibility/shootings.json
        format: json
        operations:
          create: false
          rename: false
          delete: false
        commit:
          templates:
            update: "content(cms): update page visibility {path}"
        fields:
          - name: sections
            component: page-visibility-sections
'''


def run(*args: str) -> None:
    subprocess.run(args, check=True)


text = PAGES.read_text(encoding='utf-8')
if 'page-visibility-sections:' in text or 'name: page-visibility' in text:
    raise SystemExit('page visibility CMS configuration already exists')

component_marker = '\nmedia:\n'
content_marker = '\n  - name: media-library\n'
if text.count(component_marker) != 1:
    raise SystemExit('expected exactly one media marker')
if text.count(content_marker) != 1:
    raise SystemExit('expected exactly one media-library marker')

text = text.replace(component_marker, f'\n{component}\nmedia:\n', 1)
text = text.replace(content_marker, f'\n{group}\n  - name: media-library\n', 1)
PAGES.write_text(text, encoding='utf-8')

for required in (
    'src/content/visibility/jestei-pool.json',
    'src/content/visibility/styx.json',
    'src/content/visibility/sensetique.json',
    'src/content/visibility/shootings.json',
    'label: Показывать секцию',
    'label: Показывать блок',
    'readonly: true',
):
    if required not in text:
        raise SystemExit(f'missing generated CMS contract: {required}')

run('git', 'fetch', 'origin', 'dev:refs/remotes/origin/dev', '--force')
with WORKFLOW.open('wb') as target:
    subprocess.run(
        ['git', 'show', 'origin/dev:.github/workflows/ui-responsive.yml'],
        check=True,
        stdout=target,
    )

run('git', 'diff', '--check')
run('git', 'config', 'user.name', 'github-actions[bot]')
run('git', 'config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com')
run('git', 'add', str(PAGES), str(WORKFLOW))
run('git', 'rm', str(SELF))
run('git', 'commit', '-m', 'cms: expose page visibility controls')
run('git', 'push', 'origin', f'HEAD:{subprocess.check_output(["git", "branch", "--show-current"], text=True).strip()}')
