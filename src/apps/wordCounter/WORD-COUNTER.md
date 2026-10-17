# Word Counter

## Overview
Word Counter analyzes text as the user types or pastes it. Bengali and other Unicode scripts are supported, and the entire analysis runs locally in the browser.

## Statistics
The live report includes word and character counts (with and without whitespace), sentences, paragraphs, lines, unique words, vocabulary diversity, average word and sentence length, longest and shortest words, reading and speaking estimates, page estimates, punctuation, standalone numbers, letters by case, whitespace, URLs, and frequently repeated words.

## Counting rules
- Words are Unicode letters, marks, or numbers; internal apostrophes stay with their word, decimals remain one number token, and web links are treated as one word.
- Characters count visible grapheme clusters when the browser supports `Intl.Segmenter`; otherwise Unicode code points are counted. The no-space total excludes whitespace.
- Sentence estimates recognize common English, Bengali, Arabic, and CJK terminal marks. Paragraphs are blocks separated by blank lines; lines include blank lines.
- Reading and speaking estimates use 200 and 130 words per minute. A page is estimated at 500 words.

## Privacy and state
Text is analyzed in memory and is not uploaded or saved. Paste and Copy report use the browser clipboard only after a user action. There is no app data store or settings screen.
