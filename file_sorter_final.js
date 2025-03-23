const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function sortFilesByExtension(directory, copyFiles) {
    const files = fs.readdirSync(directory);
    const sortedFolderName = path.basename(directory) + ' Sorted';
    const sortedFolderPath = path.join(path.dirname(directory), 'Sorted', sortedFolderName);
    const sortedParentPath = path.join(path.dirname(directory), 'Sorted');
    if (!fs.existsSync(sortedParentPath)) fs.mkdirSync(sortedParentPath);
    if (!fs.existsSync(sortedFolderPath)) fs.mkdirSync(sortedFolderPath);
    files.forEach(file => {
        const oldPath = path.join(directory, file);
        if (!fs.statSync(oldPath).isFile()) return;
        const ext = path.extname(file).toLowerCase();
        const extFolder = path.join(sortedFolderPath, ext.substring(1) || 'no_extension');
        if (!fs.existsSync(extFolder)) fs.mkdirSync(extFolder);
        const newPath = path.join(extFolder, file);
        if (fs.existsSync(newPath)) {
            console.log(`Duplicate detected: ${path.basename(newPath)}`);
        } else {
            if (copyFiles) fs.copyFileSync(oldPath, newPath);
            else fs.renameSync(oldPath, newPath);
        }
    });
    console.log(`Files sorted by extension and moved/copied to ${sortedFolderPath}.`);
    return sortedFolderPath;
}

async function searchWithOllama(sortedFolderPath, query) {
    const files = fs.readdirSync(sortedFolderPath, { recursive: true });
    const readableExtensions = ['.txt', '.docx', '.pptx', '.pdf', '.png'];
    let readableFiles = [];
    let keywordMatches = [];
    const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    for (const file of files) {
        const filePath = path.join(sortedFolderPath, file);
        if (fs.statSync(filePath).isFile() && readableExtensions.includes(path.extname(filePath).toLowerCase())) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                readableFiles.push({ filePath, content: content.slice(0, 1500) });
                const lowerContent = content.toLowerCase();
                if (keywords.some(keyword => lowerContent.includes(keyword))) {
                    keywordMatches.push(path.basename(filePath));
                }
            } catch (e) {
                console.log(`Skipping ${path.basename(filePath)}: Cannot read as text (${e.message})`);
            }
        }
    }
    if (readableFiles.length === 0) {
        console.log("No readable files (e.g., txt, docx, pptx, pdf, png) found to process the query.");
        return;
    }
    const combinedContent = readableFiles.map(f => f.content).join('\n');
    const prompt = `Based on the following text from multiple files:\n"${combinedContent.slice(0, 4000)}"\nAnswer this question naturally and concisely: "${query}"`;
    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'gemma3:1b',
            prompt: prompt,
            stream: true,
            temperature: 0.7,
            max_tokens: 200
        })
    });
    console.log("\nAnswer: ");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let answer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
            if (line.trim()) {
                try {
                    const json = JSON.parse(line);
                    if (json.response) {
                        process.stdout.write(json.response);
                        answer += json.response;
                    }
                } catch (e) {
                    // Skip invalid JSON lines silently
                }
            }
        }
    }
    process.stdout.write('\n');
    console.log("Files with related data or keywords:");
    if (keywordMatches.length > 0) {
        keywordMatches.forEach((file, index) => {
            console.log(`${index + 1}. ${file}`);
        });
    } else {
        console.log("No files contain data or keywords related to this query.");
    }
    console.log();
}

function promptForFolder() {
    rl.question('Enter the folder to sort (e.g., Test, Documents, Downloads): ', (folder) => {
        const baseDirectory = 'C:\\Users\\abhis';
        const directoryPath = path.join(baseDirectory, folder);
        try {
            fs.readdirSync(directoryPath);
            rl.question('Do you want to copy the files instead of moving them? (Yes/No): ', (answer) => {
                const copyFiles = answer.toLowerCase() === 'yes';
                const sortedFolderPath = sortFilesByExtension(directoryPath, copyFiles);
                console.log();
                console.log('Files organized. You can now search with FiMi.');
                console.log();
                promptForQuery(sortedFolderPath);
            });
        } catch (e) {
            if (e.code === 'ENOENT') {
                console.log(`Folder '${folder}' does not exist in ${baseDirectory}. Try again.`);
                promptForFolder();
            } else {
                console.error(`Error: ${e.message}`);
                rl.close();
            }
        }
    });
}

function promptForQuery(sortedFolderPath) {
    rl.question('Enter a question (or "exit" to quit): ', async (query) => {
        if (query.toLowerCase() === 'exit') {
            rl.close();
            return;
        }
        await searchWithOllama(sortedFolderPath, query);
        promptForQuery(sortedFolderPath);
    });
}

function main() {
    promptForFolder();
}

main();
