const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function deleteDuplicates(directory, fileName) {
    const files = fs.readdirSync(directory);
    files.forEach(file => {
        const filePath = path.join(directory, file);
        if (fs.statSync(filePath).isDirectory()) {
            deleteDuplicates(filePath, fileName);
        } else if (file === fileName) {
            fs.unlinkSync(filePath);
            console.log(`Deleted duplicate file: ${filePath}`);
        }
    });
}

function sortFilesByExtension(directory, copyFiles) {
    const files = fs.readdirSync(directory);
    const sortedFolderName = path.basename(directory) + ' Sorted';
    const sortedFolderPath = path.join(path.dirname(directory), 'Sorted', sortedFolderName);

    if (!fs.existsSync(path.join(path.dirname(directory), 'Sorted'))) {
        fs.mkdirSync(path.join(path.dirname(directory), 'Sorted'));
    }

    if (!fs.existsSync(sortedFolderPath)) {
        fs.mkdirSync(sortedFolderPath);
    }

    files.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        const extFolder = path.join(sortedFolderPath, ext.substring(1));

        if (!fs.existsSync(extFolder)) {
            fs.mkdirSync(extFolder);
        }

        const oldPath = path.join(directory, file);
        const newPath = path.join(extFolder, file);

        if (fs.statSync(oldPath).isFile()) {
            deleteDuplicates(extFolder, file);

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
