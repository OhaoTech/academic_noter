# Academic Notes System

A comprehensive system for managing academic papers and notes, with Zotero integration.

## Features

- Automatic synchronization with Zotero storage
- Organized paper management
- Paper metadata indexing
- Easy-to-use configuration

## Setup

1. Install Python dependencies:
```bash
pip install pathlib
```

2. Configure your paths in `config.json`:
- Set your Zotero storage path
- Configure your preferred output directories

3. Run the sync script:
```bash
python sync_zotero.py
```

## Directory Structure

```
academic_notes/
├── papers/         # Synchronized PDFs from Zotero
├── notes/          # Your LaTeX/Markdown notes
└── templates/      # Note templates
```

## Paper Index

The system maintains a `paper_index.json` file that tracks:
- Paper metadata (authors, year, title)
- Original Zotero paths
- Synced locations
- Zotero IDs

## Planned Features

- [ ] Web-based LaTeX editor
- [ ] Local TeXLive compiler integration
- [ ] Real-time rendering
- [ ] Rich text editor with LaTeX support
- [ ] Interactive visualizations
- [ ] Multi-runtime notebook support
