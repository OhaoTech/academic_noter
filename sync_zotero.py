import os
import shutil
from pathlib import Path
import re
from typing import Dict, List, Optional
import json

class ZoteroSync:
    def __init__(self, zotero_storage_path: str, output_path: str):
        self.zotero_storage_path = Path(zotero_storage_path)
        self.output_path = Path(output_path)
        self.papers_path = self.output_path / "papers"
        self.papers_path.mkdir(parents=True, exist_ok=True)
        
        # Load existing paper index if it exists
        self.index_file = self.output_path / "paper_index.json"
        self.paper_index = self._load_paper_index()

    def _load_paper_index(self) -> Dict:
        """Load existing paper index or create new one"""
        if self.index_file.exists():
            with open(self.index_file, 'r') as f:
                return json.load(f)
        return {}

    def _save_paper_index(self):
        """Save paper index to file"""
        with open(self.index_file, 'w') as f:
            json.dump(self.paper_index, f, indent=2)

    def _parse_paper_info(self, filename: str) -> Optional[Dict]:
        """Extract paper information from filename"""
        # Common pattern in your files: Author et al. - Year - Title.pdf
        pattern = r"(.*?) et al\. - (\d{4}) - (.*?)\.pdf"
        match = re.match(pattern, filename)
        
        if match:
            return {
                "authors": match.group(1).strip(),
                "year": match.group(2),
                "title": match.group(3).strip(),
            }
        return None

    def sync(self):
        """Sync PDFs from Zotero storage to papers directory"""
        print("Starting Zotero sync...")
        
        # Scan all subdirectories in Zotero storage
        for item_dir in self.zotero_storage_path.iterdir():
            if not item_dir.is_dir():
                continue
                
            # Look for PDF files in each directory
            for pdf_file in item_dir.glob("*.pdf"):
                paper_info = self._parse_paper_info(pdf_file.name)
                
                if paper_info:
                    # Create a clean filename
                    clean_title = re.sub(r'[^\w\s-]', '', paper_info['title'])
                    new_filename = f"{paper_info['authors']}_{paper_info['year']}_{clean_title}.pdf"
                    new_filepath = self.papers_path / new_filename
                    
                    # Check if file already exists and is different
                    if not new_filepath.exists() or os.path.getmtime(pdf_file) > os.path.getmtime(new_filepath):
                        shutil.copy2(pdf_file, new_filepath)
                        print(f"Copied: {new_filename}")
                        
                        # Update index
                        self.paper_index[new_filename] = {
                            **paper_info,
                            "original_path": str(pdf_file),
                            "synced_path": str(new_filepath),
                            "zotero_id": item_dir.name
                        }
        
        # Save updated index
        self._save_paper_index()
        print("Sync completed!")

def main():
    # Default paths - update these as needed
    ZOTERO_STORAGE = "/Users/franktudor/Zotero/storage"
    OUTPUT_DIR = "./academic_notes"
    
    syncer = ZoteroSync(ZOTERO_STORAGE, OUTPUT_DIR)
    syncer.sync()

if __name__ == "__main__":
    main() 