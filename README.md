# Canvas-Quiz-Exporter
A Tampermonkey userscript that exports Canvas LMS quiz questions and answers to a formatted `.txt` file with a single click.

## Features

- 📄 One-click export to `.txt` file
- ✅ Automatically detects selected (correct) answers
- 🔢 Supports both single-choice and multiple-choice questions
- 📝 Clean, readable formatting with question numbers and answer labels
- 🌐 Works on any Canvas LMS quiz result page

## Output Format

```
Week 1 - Introduction to Applied AI

1. [C] Why is it difficult to define coordinate changes by hand for the MNIST example
   of handwritten digit classification?

   A. Each handwritten digit consists of more numbers than a point in 2D space
      for the black/white point example
   B. It is difficult to add multiple rules for complex tasks, because for every
      rule we have to take into account interactions with all the other rules
   C. All other answers are correct
   D. There are many ways we can write a given digit, so it would be difficult
      to cover all of them
   E. There are more classes than in the example with black and white points
```
<img width="1883" height="1389" alt="Snipaste_2026-04-25_10-45-06" src="https://github.com/user-attachments/assets/d77d96a4-fba1-4ca8-8436-9985cf32a409" />
