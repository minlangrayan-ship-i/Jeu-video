# Character credits

Characters and animations: **Kay Lousberg / KayKit**, https://kaylousberg.com/.

Licensed under **Creative Commons Zero (CC0)**. Full distributed licence:
[LICENSE-KayKit.txt](LICENSE-KayKit.txt).

- Engineer and Rogue: KayKit Adventurers 2.0.
- Walking_A and Running_A: KayKit Character Animations 1.1, Rig Medium Movement Basic.
- Idle_A, Interact and Use_Item: KayKit Character Animations 1.1, Rig Medium General.

Versioned source mirror:
https://github.com/GeorgeQLe/assets-kaykit-3d-characters/tree/af08a62d3669370ec4636ae6314b38cdcd5dd759

The files are hosted with the game. No external model service is contacted while playing.
The animation packs have been reduced to the five used clips and their required buffer data;
character geometry is unchanged. Compatible skinned parts are batched at runtime.

To reproduce the assets, run `python3 scripts/prepare-characters.py` from the repository root.
The script verifies the pinned source SHA-256 checksums before writing any output.
