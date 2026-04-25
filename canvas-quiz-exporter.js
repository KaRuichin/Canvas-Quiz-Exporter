// ==UserScript==
// @name         Canvas Quiz Exporter (TXT)
// @namespace    https://github.com/KaRuichin/Canvas-Quiz-Exporter
// @version      1.1
// @description  Export Canvas LMS quiz questions and answers to a formatted TXT file
// @author       KaRuichin
// @match        https://canvas.newcastle.edu.au/courses/*/quizzes/*
// @homepageURL  https://github.com/KaRuichin/Canvas-Quiz-Exporter
// @supportURL   https://github.com/KaRuichin/Canvas-Quiz-Exporter/issues
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const PAGE_WIDTH = 80;

    // 创建导出按钮
    const btn = document.createElement('button');
    btn.textContent = '📄 导出 TXT';
    btn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 99999;
        padding: 10px 18px;
        background: #0770A3;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    `;
    btn.addEventListener('mouseenter', () => btn.style.background = '#055a82');
    btn.addEventListener('mouseleave', () => btn.style.background = '#0770A3');
    document.body.appendChild(btn);

    btn.addEventListener('click', exportQuiz);

    function exportQuiz() {
        const rawTitle = document.title || '';
        const titleMatch = rawTitle.match(/(Week\s+\d+\s+Quiz[^:]*)/i);
        const quizTitle = titleMatch ? titleMatch[1].trim() : rawTitle.split(':')[0].trim();

        const lines = [];
        lines.push(quizTitle);
        lines.push('');

        const questions = document.querySelectorAll('.display_question.question');

        if (questions.length === 0) {
            alert('未找到题目。请确保你在已提交的测验结果页面。');
            return;
        }

        const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        questions.forEach((q, qIdx) => {
            const questionTextElem = q.querySelector('.question_text');
            const questionText = questionTextElem
                ? cleanText(questionTextElem.innerText)
                : `(Question ${qIdx + 1})`;

            const answerElems = q.querySelectorAll('.answer');
            const correctLetters = [];
            const answerLines = [];

            answerElems.forEach((a, ai) => {
                const letter = LETTERS[ai] || String(ai + 1);
                const textElem = a.querySelector('.answer_text, .answer_html');
                let ansText = textElem ? cleanText(textElem.innerText) : '';
                if (!ansText) return;

                const cls = a.className;
                const isSelected = cls.includes('selected_answer');
                const isCorrect = cls.includes('correct_answer');

                if (isCorrect || isSelected) {
                    correctLetters.push(letter);
                }

                // 前缀：e.g. "   A. "（共6字符）
                const prefix = `   ${letter}. `;
                const indent = ' '.repeat(prefix.length);
                const wrapped = wrapText(
                    ansText,
                    PAGE_WIDTH - prefix.length,  // 第一行可用宽度
                    PAGE_WIDTH - indent.length,   // 续行可用宽度
                    indent
                );
                answerLines.push(prefix + wrapped);
            });

            let answerLabel;
            if (correctLetters.length === 0) {
                answerLabel = '[?]';
            } else if (correctLetters.length === 1) {
                answerLabel = `[${correctLetters[0]}]`;
            } else {
                answerLabel = `[${correctLetters.join('')}(多选)]`;
            }

            // 题目前缀：e.g. "1. [D] "
            const qPrefix = `${qIdx + 1}. ${answerLabel} `;
            const qIndent = ' '.repeat(3); // 续行缩进3个空格
            const wrappedQuestion = wrapText(
                questionText,
                PAGE_WIDTH - qPrefix.length,
                PAGE_WIDTH - qIndent.length,
                qIndent
            );

            lines.push(qPrefix + wrappedQuestion);
            lines.push('');
            answerLines.forEach(l => lines.push(l));
            lines.push('');
        });

        const content = lines.join('\n');
        const filename = `${quizTitle.replace(/[\\/:*?"<>|]/g, '_')}.txt`;
        downloadTxt(content, filename);
    }

    function cleanText(text) {
        if (!text) return '';
        return text
            .replace(/\t/g, ' ')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            // 收缩3个以上连续空行为最多2个，保留段落间的单次换行
            。replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    /**
     * 对文本进行自动换行，同时保留原文本中真实存在的换行符。
     *
     * @param {string} text            - 待处理的纯文本
     * @param {number} firstLineWidth  - 第一行可用字符宽度（已扣除前缀长度）
     * @param {number} contWidth       - 续行可用字符宽度（已扣除缩进长度）
     * @param {string} contIndent      - 续行前缀缩进字符串
     * @returns {string}
     */
    function wrapText(text, firstLineWidth, contWidth, contIndent) {
        const paragraphs = text.split('\n');
        const resultLines = [];
        let isFirstLine = true;

        paragraphs.forEach(para => {
            const trimmed = para.trim();

            // 空行：保留为真实段落分隔
            if (!trimmed) {
                resultLines.push('');
                isFirstLine = false;
                return;
            }

            const words = trimmed.split(' ');
            let currentLine = '';

            words.forEach(word => {
                if (!word) return;
                const maxW = isFirstLine ? firstLineWidth : contWidth;

                if (currentLine === '') {
                    currentLine = word;
                } else if ((currentLine + ' ' + word).length <= maxW) {
                    currentLine += ' ' + word;
                } else {
                    resultLines.push(isFirstLine ? currentLine : contIndent + currentLine);
                    isFirstLine = false;
                    currentLine = word;
                }
            });

            if (currentLine) {
                resultLines.push(isFirstLine ? currentLine : contIndent + currentLine);
                isFirstLine = false;
            }
        });

        return resultLines.join('\n');
    }

    function downloadTxt(content, filename) {
        const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

})();
