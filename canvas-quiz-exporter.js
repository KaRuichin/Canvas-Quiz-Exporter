// ==UserScript==
// @name         Canvas Quiz Exporter (TXT)
// @namespace    https://canvas.newcastle.edu.au/
// @version      1.0
// @description  Export Canvas Quiz questions and answers to TXT format
// @author       You
// @match        https://canvas.newcastle.edu.au/courses/*/quizzes/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

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
        // 获取 Quiz 标题
        const rawTitle = document.title || '';
        // 提取 "Week X Quiz" 部分
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
            // 获取题目文本
            const questionTextElem = q.querySelector('.question_text');
            const questionText = questionTextElem
                ? cleanText(questionTextElem.innerText)
                : `(Question ${qIdx + 1})`;

            // 判断题型
            const isMultiple = q.classList.contains('multiple_answers_question');
            const isMultipleChoice = q.classList.contains('multiple_choice_question');

            // 获取答案
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

                // 判断是否为正确答案
                const markAsCorrect = isCorrect || isSelected;
                if (markAsCorrect) {
                    correctLetters.push(letter);
                }

                // 格式化选项文本（处理换行和长文本）
                const wrappedAnswer = wrapText(ansText, 66, '      ');
                answerLines.push(`   ${letter}. ${wrappedAnswer}`);
            });

            // 生成答案标注
            let answerLabel;
            if (correctLetters.length === 0) {
                answerLabel = '[?]'; // 无法确定正确答案
            } else if (correctLetters.length === 1) {
                answerLabel = `[${correctLetters[0]}]`;
            } else {
                answerLabel = `[${correctLetters.join('')}(多选)]`;
            }

            // 格式化题目文本（处理换行）
            const wrappedQuestion = wrapText(questionText, 70, '   ');

            lines.push(`${qIdx + 1}. ${answerLabel} ${wrappedQuestion}`);
            lines.push('');
            answerLines.forEach(l => lines.push(l));
            lines.push('');
        });

        // 下载文件
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
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function wrapText(text, maxWidth, indent) {
        // 按换行符分割，再对每行进行宽度包装
        const paragraphs = text.split('\n');
        const resultLines = [];
        let isFirst = true;

        paragraphs.forEach(para => {
            para = para.trim();
            if (!para) return;

            const words = para.split(' ');
            let currentLine = '';

            words.forEach(word => {
                if (!word) return;
                if (currentLine === '') {
                    currentLine = word;
                } else if ((currentLine + ' ' + word).length <= maxWidth) {
                    currentLine += ' ' + word;
                } else {
                    if (isFirst) {
                        resultLines.push(currentLine);
                        isFirst = false;
                    } else {
                        resultLines.push(indent + currentLine);
                    }
                    currentLine = word;
                }
            });

            if (currentLine) {
                if (isFirst) {
                    resultLines.push(currentLine);
                    isFirst = false;
                } else {
                    resultLines.push(indent + currentLine);
                }
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
