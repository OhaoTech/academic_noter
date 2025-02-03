from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tempfile
import os
import subprocess
from pathlib import Path
import shutil
import asyncio
from typing import Optional, List
import json

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ManimCode(BaseModel):
    code: str
    quality: str = "medium"  # low, medium, high
    output_format: str = "mp4"

class LaTeXCode(BaseModel):
    code: str
    packages: List[str] = []

async def compile_manim(code: str, quality: str, output_format: str) -> str:
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create the Python file
        py_file = Path(tmpdir) / "scene.py"
        py_file.write_text(code)
        
        # Prepare Manim command
        quality_flag = {
            "low": "-ql",
            "medium": "-qm",
            "high": "-qh"
        }.get(quality, "-qm")
        
        try:
            # Run Manim
            process = await asyncio.create_subprocess_exec(
                "manim",
                quality_flag,
                "-f",
                str(py_file),
                cwd=tmpdir,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                raise HTTPException(status_code=500, detail=stderr.decode())
            
            # Find the output file
            media_dir = Path(tmpdir) / "media"
            video_file = list(media_dir.glob(f"**/*.{output_format}"))[0]
            
            # Copy to a permanent location
            output_dir = Path("outputs/manim")
            output_dir.mkdir(parents=True, exist_ok=True)
            output_path = output_dir / video_file.name
            shutil.copy2(video_file, output_path)
            
            return str(output_path)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

async def compile_latex(code: str, packages: List[str]) -> bytes:
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create the LaTeX file
        tex_file = Path(tmpdir) / "document.tex"
        
        # Prepare the LaTeX document
        document = [
            r"\documentclass{article}",
            r"\usepackage{amsmath,amssymb}"
        ]
        
        # Add requested packages
        for package in packages:
            document.append(f"\\usepackage{{{package}}}")
            
        document.extend([
            r"\begin{document}",
            code,
            r"\end{document}"
        ])
        
        tex_file.write_text("\n".join(document))
        
        try:
            # Run pdflatex
            process = await asyncio.create_subprocess_exec(
                "pdflatex",
                "-interaction=nonstopmode",
                str(tex_file),
                cwd=tmpdir,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                raise HTTPException(status_code=500, detail=stderr.decode())
            
            # Read the PDF
            pdf_file = Path(tmpdir) / "document.pdf"
            return pdf_file.read_bytes()
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/manim")
async def create_manim_animation(manim: ManimCode, background_tasks: BackgroundTasks):
    output_path = await compile_manim(manim.code, manim.quality, manim.output_format)
    return {"output_path": output_path}

@app.post("/api/latex")
async def compile_latex_document(latex: LaTeXCode):
    pdf_bytes = await compile_latex(latex.code, latex.packages)
    return {"pdf_bytes": pdf_bytes} 