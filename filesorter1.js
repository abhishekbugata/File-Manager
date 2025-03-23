const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function sortFilesByExtension(directory, copyFiles) {
    const files = fs.readdirSync(directory);
    const sortedFolderName = path.basename(directory) + ' Sorted';
    const sortedFolderPath = path.join(path.dirname(directory), 'Sorted', sortedFolderName);

    // Create 'Sorted' parent directory if it doesn’t exist
    const sortedParentPath = path.join(path.dirname(directory), 'Sorted');
    if (!fs.existsSync(sortedParentPath)) {
        fs.mkdirSync(sortedParentPath);
    }

    // Create sorted subfolder if it doesn’t exist
    if (!fs.existsSync(sortedFolderPath)) {
        fs.mkdirSync(sortedFolderPath);
    }

    files.forEach(file => {
        const oldPath = path.join(directory, file);
        if (!fs.statSync(oldPath).isFile()) return; // Skip directories

        const ext = path.extname(file).toLowerCase();
        const extFolder = path.join(sortedFolderPath, ext.substring(1) || 'no_extension'); // Handle files without extensions

        // Create extension folder if it doesn’t exist
        if (!fs.existsSync(extFolder)) {
            fs.mkdirSync(extFolder);
        }

        const newPath = path.join(extFolder, file);

        // Check for duplicate before transferring
        if (fs.existsSync(newPath)) {
            console.log(`Duplicate detected: ${newPath}`);
        } else {
            if (copyFiles) {
                fs.copyFileSync(oldPath, newPath);
            } else {
                fs.renameSync(oldPath, newPath);
            }
        }
    });

    console.log(`Files sorted by extension and moved/copied to ${sortedFolderPath}.`);
    return sortedFolderPath;
}

function main() {
    const baseDirectory = 'C:\\Users\\abhis';
    rl.question('Enter the folder to sort (e.g., Documents, Downloads): ', (folder) => {
        const directoryPath = path.join(baseDirectory, folder);
        
        rl.question('Do you want to copy the files instead of moving them? (Yes/No): ', (answer) => {
            const copyFiles = answer.toLowerCase() === 'yes';
            const sortedFolderPath = sortFilesByExtension(directoryPath, copyFiles);
            rl.close();
        });
    });
}

main();
