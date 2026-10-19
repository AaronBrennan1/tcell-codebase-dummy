# Design

The design of this repo's software, kept next to the code and changed in the same PR as
the code it describes, so the two cannot drift (QMS `MANUAL.md`, rule 1 exception).

When a merged PR changes anything in this folder, the QMS write-back records the merge
commit as the requirement's `design_sha`, and every release pins this folder by commit SHA
in its release record. Product-level design (architecture, SDS) is controlled in the QMS
repo's `03-design/`.
