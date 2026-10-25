"""Reproduce the small CC0 character assets. Python stdlib; TLS stays verified."""
import hashlib
import json
import struct
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMMIT = 'af08a62d3669370ec4636ae6314b38cdcd5dd759'
BASE = f'https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/{COMMIT}/'
FILES = [
 ('resident.glb', 'assets/kaykit/adventurers-2.0/Characters/gltf/Engineer.glb', '3398a54498a8a6a3babb43ac5f04aa8ae133d35848ed32139ffab097dcf0942a', None),
 ('neighbour.glb', 'assets/kaykit/adventurers-2.0/Characters/gltf/Rogue.glb', 'cae5d9b2f08d53f7b4ab2617d9f42f021c546eb10920455fdcd82a110867fae4', None),
 ('movement.glb', 'assets/kaykit/character-animations-1.1/Animations/gltf/Rig_Medium/Rig_Medium_MovementBasic.glb', '11422afd50abf7e8c92ea107e2e0bc94abd38023d6d15f55ad580347efbfa29e', ['Walking_A', 'Running_A']),
 ('gestures.glb', 'assets/kaykit/character-animations-1.1/Animations/gltf/Rig_Medium/Rig_Medium_General.glb', '5f725c0f745f36078c7238968cd5c04843cbc6260689eb6e7f5e2bbd7ffdd7ad', ['Idle_A', 'Interact', 'Use_Item']),
 ('LICENSE-KayKit.txt', 'LICENSES/KayKit-CC0-License.txt', '9f02357d1a4fdd7c6ed69eac5f4bf2171e34971c89d60e905af10a8db6bcc6e5', None),
]

def animations_only(data, names):
    """Keep named clips and repack only their used animation buffer views."""
    length = struct.unpack_from('<I', data, 12)[0]
    doc = json.loads(data[20:20+length])
    binary = data[28+length:]
    animations = [a for a in doc.get('animations', []) if a['name'] in names]
    assert {a['name'] for a in animations} == set(names)
    used_accessors = sorted({s[key] for a in animations for s in a['samplers'] for key in ['input', 'output']})
    accessors = [doc['accessors'][i] for i in used_accessors]
    assert all('sparse' not in a for a in accessors)
    used_views = sorted({a['bufferView'] for a in accessors})
    accessor_map = {old: new for new, old in enumerate(used_accessors)}
    view_map = {old: new for new, old in enumerate(used_views)}
    packed = bytearray()
    views = []
    for index in used_views:
        view = dict(doc['bufferViews'][index])
        start = view.get('byteOffset', 0)
        block = binary[start:start+view['byteLength']]
        packed += b'\0' * (-len(packed) % 4)
        view['byteOffset'] = len(packed)
        view['buffer'] = 0
        packed += block
        views.append(view)
    for a in accessors:
        a['bufferView'] = view_map[a['bufferView']]
    for a in animations:
        for sampler in a['samplers']:
            for key in ['input', 'output']:
                sampler[key] = accessor_map[sampler[key]]
    for node in doc['nodes']:
        node.pop('mesh', None)
        node.pop('skin', None)
    for key in ['meshes', 'skins', 'images', 'textures', 'materials', 'samplers']:
        doc.pop(key, None)
    doc.update(animations=animations, accessors=accessors, bufferViews=views, buffers=[{'byteLength': len(packed)}])
    text = json.dumps(doc, separators=(',', ':')).encode()
    text += b' ' * (-len(text) % 4)
    packed += b'\0' * (-len(packed) % 4)
    total = 12 + 8 + len(text) + 8 + len(packed)
    return struct.pack('<III', 0x46546c67, 2, total) + struct.pack('<II', len(text), 0x4e4f534a) + text + struct.pack('<II', len(packed), 0x004e4942) + packed

if __name__ == '__main__':
    destination = ROOT / 'public/models'
    destination.mkdir(parents=True, exist_ok=True)
    for name, path, checksum, clips in FILES:
        data = urllib.request.urlopen(BASE + urllib.parse.quote(path), timeout=60).read()
        if hashlib.sha256(data).hexdigest() != checksum:
            raise ValueError(f'Integrity check failed: {name}')
        output = animations_only(data, clips) if clips else data
        if name.endswith('.txt'):
            output = ('\n'.join(line.rstrip() for line in output.decode().splitlines()).strip() + '\n').encode()
        (destination / name).write_bytes(output)
        print(f'{name}: {len(output):,} bytes (source verified)')
