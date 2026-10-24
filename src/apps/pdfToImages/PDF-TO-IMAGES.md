# PDF to Images Converter

## Overview
Convert every page in a selected PDF into an individual PNG or JPEG image and download the images in a ZIP archive. PDF rendering and ZIP creation run locally in the browser.

## Workflow
1. Choose a PDF file.
2. Select PNG or JPEG and a render scale.
3. Press **Process PDF** to render every page sequentially.
4. Follow the percentage progress indicator, then download the ZIP.

## Naming and performance
Images are named `page_1.png`, `page_2.png`, and so on. When necessary, page numbers are zero-padded (for example, `page_01.png`) so alphabetical file listings remain in numeric order. Pages render one at a time using a reusable canvas, and generated images are stored without recompression to limit CPU and memory use.
