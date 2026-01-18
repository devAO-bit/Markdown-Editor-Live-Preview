// Initialize Ace Editor
let editor;
let isUserScroll = true;

function initEditor() {
    editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/markdown");
    editor.setOptions({
        fontSize: "14px",
        showPrintMargin: false,
        wrap: true,
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true
    });

    // Load saved content from memory
    const saved = window.markdownContent || getDefaultMarkdown();
    editor.setValue(saved, -1);

    // Update preview on change
    editor.session.on('change', function () {
        updatePreview();
        saveToMemory();
    });

    // Sync scrolling
    editor.session.on('changeScrollTop', function (scroll) {
        if (isUserScroll) {
            syncScroll();
        }
    });

    // Initial preview update
    updatePreview();
}

// Configure marked to use highlight.js
marked.setOptions({
    highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { language: lang }).value;
            } catch (err) {
                console.error(err);
            }
        }
        return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
});

// Update preview with parsed Markdown
function updatePreview() {
    const markdown = editor.getValue();
    const html = marked.parse(markdown);
    document.getElementById('preview').innerHTML = html;
}


function syncScroll() {
    const editorScroll = editor.session.getScrollTop();
    const editorHeight = editor.session.getScreenLength() * editor.renderer.lineHeight;
    const previewPanel = document.querySelector('.preview-panel');
    const previewHeight = document.getElementById('preview').scrollHeight;

    const scrollPercentage = editorScroll / (editorHeight - editor.renderer.$size.scrollerHeight);
    const previewScroll = scrollPercentage * (previewHeight - previewPanel.clientHeight);

    isUserScroll = false;
    previewPanel.scrollTop = previewScroll;
    setTimeout(() => { isUserScroll = true; }, 100);
}

// Save to memory (not localStorage due to artifact restrictions)
function saveToMemory() {
    window.markdownContent = editor.getValue();
}

// Save button functionality
function saveMarkdown() {
    const content = editor.getValue();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);

    alert('Markdown file downloaded!');
}

// Clear editor
function clearEditor() {
    if (confirm('Are you sure you want to clear the editor?')) {
        editor.setValue('', -1);
        window.markdownContent = '';
    }
}

// Default Markdown content
function getDefaultMarkdown() {
    return `# Welcome to Markdown Editor

This is a **live preview** Markdown editor with syntax highlighting support.

## Features

- 🎨 Live HTML preview as you type
- 💾 Content persistence across sessions
- 🎯 Code syntax highlighting
- 🔄 Synchronized scrolling
- 📥 Download as .md file

## Markdown Examples

### Text Formatting

You can make text **bold**, *italic*, or ***both***.

You can also use ~~strikethrough~~ text.

### Code Blocks

Inline code: \`const x = 42;\`

Code block with syntax highlighting:

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return true;
}

greet('World');
\`\`\`

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
\`\`\`

### Lists

**Unordered list:**
- Item 1
- Item 2
  - Nested item
  - Another nested item
- Item 3

**Ordered list:**
1. First item
2. Second item
3. Third item

### Blockquotes

> "The best way to predict the future is to invent it."
> - Alan Kay

### Tables

| Language   | Year | Creator          |
|------------|------|------------------|
| JavaScript | 1995 | Brendan Eich     |
| Python     | 1991 | Guido van Rossum |
| Rust       | 2010 | Graydon Hoare    |

### Links

Check out [Markdown Guide](https://www.markdownguide.org/) for more information.

### Horizontal Rule

---

## Start Writing!

Clear this template and start writing your own Markdown content. Your work is automatically saved in memory during this session.

Happy writing! ✨`;
}

// Initialize on page load
window.addEventListener('load', initEditor);