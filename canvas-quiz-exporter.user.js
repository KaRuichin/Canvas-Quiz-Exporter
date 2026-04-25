// ==UserScript==
// @name         Canvas Quiz Exporter (TXT)
// @namespace    https://github.com/KaRuichin/Canvas-Quiz-Exporter
// @version      1.3
// @description  Export Canvas LMS quiz questions and answers to a formatted TXT file
// @author       KaRuichin
// @match        https://canvas.newcastle.edu.au/courses/*/quizzes/*
// @homepageURL  https://github.com/KaRuichin/Canvas-Quiz-Exporter
// @supportURL   https://github.com/KaRuichin/Canvas-Quiz-Exporter/issues
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const PAGE_WIDTH = 80;
    const BTN_ID = 'canvas-quiz-exporter-btn';

    function insertButton() {
        if (document.getElementById(BTN_ID)) return;
        if (!document.querySelector('.display_question.question')) return;

        const btn = document.createElement('button');
        btn.id = BTN_ID;
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
        btn.addEventListener('click', exportQuiz);
        document.body.appendChild(btn);
    }

    insertButton();

    new MutationObserver(() => {
        if (!document.getElementById(BTN_ID)) insertButton();
    }).observe(document.body, { childList: true });

    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            setTimeout(insertButton, 1500);
        }
    }).observe(document, { subtree: true, childList: true });

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
                ? getPlainText(questionTextElem)
                : `(Question ${qIdx + 1})`;

            const answerElems = q.querySelectorAll('.answer');
            const correctLetters = [];
            const answerLines = [];

            answerElems.forEach((a, ai) => {
                const letter = LETTERS[ai] || String(ai + 1);
                const textElem = a.querySelector('.answer_text, .answer_html');
                const ansText = textElem ? getPlainText(textElem) : '';
                if (!ansText) return;

                const cls = a.className;
                if (cls.includes('correct_answer') || cls.includes('selected_answer')) {
                    correctLetters.push(letter);
                }

                const prefix = `   ${letter}. `;
                const indent = ' '.repeat(prefix.length);
                const wrapped = wrapText(ansText, PAGE_WIDTH - prefix.length, PAGE_WIDTH - indent.length, indent);
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

            const qPrefix = `${qIdx + 1}. ${answerLabel} `;
            const qIndent = '   ';
            const wrappedQuestion = wrapText(questionText, PAGE_WIDTH - qPrefix.length, PAGE_WIDTH - qIndent.length, qIndent);

            lines.push(qPrefix + wrappedQuestion);
            lines.push('');
            answerLines.forEach(l => lines.push(l));
            lines.push('');
        });

        const content = lines.join('\n');
        const filename = `${quizTitle.replace(/[\\/:*?"<>|]/g, '_')}.txt`;
        downloadTxt(content, filename);
    }

    /**
     * 从 DOM 元素提取纯文本，使用 innerHTML→textContent 方式，
     * 不受浏览器窗口宽度和 CSS 渲染影响。
     * 保留 <br>、<p>、<li> 等产生的真实语义换行。
     */
    function getPlainText(element) {
        const clone = element.cloneNode(true);
        // <br> 转换为换行
        clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
        // 块级元素后插入换行，保留段落结构
        clone.querySelectorAll('p, div, li, h1, h2, h3, h4').forEach(el => {
            el.insertAdjacentText('afterend', '\n');
        });
        return clone.textContent
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function wrapText(text, firstLineWidth, contWidth, contIndent) {
        const paragraphs = text.split('\n');
        const resultLines = [];
        let isFirstLine = true;

        paragraphs.forEach(para => {
            const trimmed = para.trim();
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
