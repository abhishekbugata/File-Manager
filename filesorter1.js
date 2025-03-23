const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

// Create an interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to delete duplicates
function deleteDuplicates(directory, fileName) {
    const files = fs.readdirSync(directory);
    files.forEach(file => {
        const filePath = path.join(directory, file);
        if (fs.statSync(filePath).isDirectory()) {
            // Recursively check in subdirectories
            deleteDuplicates(filePath, fileName);
        } else if (file === fileName) {
            // Delete the duplicate file
            fs.unlinkSync(filePath);
            console.log(`Deleted duplicate file: ${filePath}`);
        }
    });
}

// Function to sort files by extension and move or copy them to new folders
function sortFilesByExtension(directory, copyFiles) {
    // Read all files in the specified directory
    const files = fs.readdirSync(directory);

    // Create a new folder for sorted files
    const sortedFolderName = path.basename(directory) + ' Sorted';
    const sortedFolderPath = path.join(path.dirname(directory), 'Sorted', sortedFolderName);

    // Create the Sorted folder if it doesn't exist
    if (!fs.existsSync(path.join(path.dirname(directory), 'Sorted'))) {
        fs.mkdirSync(path.join(path.dirname(directory), 'Sorted'));
    }

    // Create the sorted folder if it doesn't exist
    if (!fs.existsSync(sortedFolderPath)) {
        fs.mkdirSync(sortedFolderPath);
    }

    // Create a folder for each file extension within the sorted folder
    files.forEach(file => {
        const ext = path.extname(file).toLowerCase(); // Get the file extension
        const extFolder = path.join(sortedFolderPath, ext.substring(1)); // Create folder name without the dot

        // Create the folder for the extension if it doesn't exist
        if (!fs.existsSync(extFolder)) {
            fs.mkdirSync(extFolder);
        }

        // Define old and new paths
        const oldPath = path.join(directory, file);
        const newPath = path.join(extFolder, file);

        // Check if it's a file (not a directory) before moving or copying
        if (fs.statSync(oldPath).isFile()) {
            // Delete duplicates in the destination folder
            deleteDuplicates(extFolder, file);

            // Move or copy the file based on user input
            if (copyFiles) {
                fs.copyFileSync(oldPath, newPath); // Copy the file
            } else {
                fs.renameSync(oldPath, newPath); // Move the file
            }
        }
    });

    console.log(`Files sorted by extension and moved/copied to ${sortedFolderPath}.`);
    return sortedFolderPath; // Return the path of the sorted folder
}

// Main function
function main() {
    const baseDirectory = 'C:\\Users\\abhis'; // Base directory
    rl.question('Enter the folder to sort (e.g., Documents, Downloads): ', (folder) => {
        const directoryPath = path.join(baseDirectory, folder);
        
        rl.question('Do you want to copy the files instead of moving them? (Yes/No): ', (answer) => {
            const copyFiles = answer.toLowerCase() === 'yes';

            // Sort the files and get the path of the sorted folder
            const sortedFolderPath = sortFilesByExtension(directoryPath, copyFiles);

            // Close the readline interface
            rl.close();
        });
    });
}

// Run the main function
main();